import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


class AttributionService:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "attribution_events.jsonl"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("", encoding="utf-8")

    def ingest(self, user_id: str, event: Dict[str, Any]) -> Dict[str, Any]:
        row = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "type": event.get("type", "unknown"),
            "utm_source": event.get("utm_source", ""),
            "utm_campaign": event.get("utm_campaign", ""),
            "campaign_id": event.get("campaign_id", ""),
            "adset_id": event.get("adset_id", ""),
            "session_id": event.get("session_id", ""),
            "customer_id": event.get("customer_id", ""),
            "order_id": event.get("order_id", ""),
            "revenue": float(event.get("revenue", 0) or 0),
            "ad_spend": float(event.get("ad_spend", 0) or 0),
            "meta": event.get("meta", {}),
        }
        with self.path.open("a", encoding="utf-8") as fp:
            fp.write(json.dumps(row) + "\n")
        return row

    def _read_user_events(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            lines = self.path.read_text(encoding="utf-8").splitlines()
        except Exception:
            return []

        events: List[Dict[str, Any]] = []
        for line in lines:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if row.get("user_id") == user_id:
                events.append(row)
        return events

    def summary(self, user_id: str) -> Dict[str, Any]:
        events = self._read_user_events(user_id)
        spend = sum(float(e.get("ad_spend", 0) or 0) for e in events)
        revenue = sum(float(e.get("revenue", 0) or 0) for e in events)
        purchases = sum(1 for e in events if e.get("type") == "purchase")
        sessions = len({e.get("session_id") for e in events if e.get("session_id")})
        customers = {e.get("customer_id") for e in events if e.get("customer_id")}
        by_campaign: Dict[str, Dict[str, float]] = defaultdict(lambda: {"spend": 0.0, "revenue": 0.0})
        by_adset: Dict[str, Dict[str, float]] = defaultdict(lambda: {"spend": 0.0, "revenue": 0.0})
        customer_first_purchase: Dict[str, str] = {}
        customer_revenue: Dict[str, float] = defaultdict(float)

        for event in events:
            campaign = str(event.get("utm_campaign", "") or "unknown")
            by_campaign[campaign]["spend"] += float(event.get("ad_spend", 0) or 0)
            by_campaign[campaign]["revenue"] += float(event.get("revenue", 0) or 0)
            adset = str(event.get("adset_id", "") or "unknown")
            by_adset[adset]["spend"] += float(event.get("ad_spend", 0) or 0)
            by_adset[adset]["revenue"] += float(event.get("revenue", 0) or 0)

            customer_id = str(event.get("customer_id", "") or "")
            if customer_id:
                customer_revenue[customer_id] += float(event.get("revenue", 0) or 0)
                if event.get("type") == "purchase" and customer_id not in customer_first_purchase:
                    customer_first_purchase[customer_id] = str(event.get("ts", ""))

        campaigns = []
        for campaign, vals in by_campaign.items():
            c_spend = vals["spend"]
            c_revenue = vals["revenue"]
            campaigns.append(
                {
                    "utm_campaign": campaign,
                    "spend": round(c_spend, 2),
                    "revenue": round(c_revenue, 2),
                    "roas": round((c_revenue / c_spend), 3) if c_spend > 0 else None,
                }
            )

        adsets = []
        for adset_id, vals in by_adset.items():
            a_spend = vals["spend"]
            a_revenue = vals["revenue"]
            adsets.append(
                {
                    "adset_id": adset_id,
                    "spend": round(a_spend, 2),
                    "revenue": round(a_revenue, 2),
                    "roas": round((a_revenue / a_spend), 3) if a_spend > 0 else None,
                }
            )

        cohorts: Dict[str, Dict[str, float]] = defaultdict(lambda: {"customers": 0, "revenue": 0.0})
        counted_customers = set()
        for customer_id, first_ts in customer_first_purchase.items():
            month = "unknown"
            if first_ts and len(first_ts) >= 7:
                month = first_ts[:7]
            cohorts[month]["revenue"] += customer_revenue.get(customer_id, 0.0)
            if customer_id not in counted_customers:
                cohorts[month]["customers"] += 1
                counted_customers.add(customer_id)

        cohort_rows = []
        for month, vals in cohorts.items():
            customer_count = int(vals["customers"])
            rev = float(vals["revenue"])
            cohort_rows.append(
                {
                    "cohort_month": month,
                    "customers": customer_count,
                    "revenue": round(rev, 2),
                    "ltv": round((rev / customer_count), 2) if customer_count > 0 else 0,
                }
            )

        customer_count = max(1, len(customers))
        cac = round((spend / customer_count), 2) if spend > 0 else 0

        return {
            "user_id": user_id,
            "events": len(events),
            "sessions": sessions,
            "purchases": purchases,
            "customers": len(customers),
            "spend": round(spend, 2),
            "revenue": round(revenue, 2),
            "roas": round((revenue / spend), 3) if spend > 0 else None,
            "cac": cac,
            "ltv": round((revenue / customer_count), 2),
            "campaigns": sorted(campaigns, key=lambda x: x["revenue"], reverse=True),
            "adsets": sorted(adsets, key=lambda x: x["revenue"], reverse=True),
            "cohorts": sorted(cohort_rows, key=lambda x: x["cohort_month"]),
        }


attribution_service = AttributionService()
