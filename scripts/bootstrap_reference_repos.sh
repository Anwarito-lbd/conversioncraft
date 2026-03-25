#!/usr/bin/env bash
set -euo pipefail
export GIT_TERMINAL_PROMPT=0
export GIT_ASKPASS=true

ROOT="/Users/anwarito/Desktop/conversioncraft5"
REF_DIR="$ROOT/tools/references"
REPORT="$ROOT/docs/BOOTSTRAP_REFERENCES_STATUS.md"
mkdir -p "$REF_DIR"

# name|url|relevant|used_in_plan|notes
items=(
  "Automated-Dropshipping-Tool|https://github.com/Pasindunabesinghe/Automated-Dropshipping-Price-Sentiment-Analysis-Tool.git|yes|yes|Dropshipping analytics reference"
  "HasData-auto-ecommerce-scraper|https://github.com/hasdata/auto-ecommerce-scraper.git|yes|yes|Scraping architecture reference"
  "Scrapfly-scrapers|https://github.com/scrapfly/scrapfly-scrapers.git|yes|yes|Scraper patterns reference"
  "ecommercetools|https://github.com/practical-data-science/ecommercetools.git|yes|yes|Python ecommerce utilities"
  "MedusaJS|https://github.com/medusajs/medusa.git|yes|no|Large commerce backend reference"
  "ali-grabber|https://github.com/dizaraj/ali-grabber.git|yes|yes|Supplier scraping ideas"
  "Pensil|https://github.com/pensil-community/pensil.git|yes|no|Community product model"
  "Forem|https://github.com/forem/forem.git|yes|no|Community platform reference"
  "Discourse|https://github.com/discourse/discourse.git|yes|no|Community architecture reference"
  "StandardNotes|https://github.com/standardnotes/app.git|yes|no|Membership/productization reference"
  "Ghost|https://github.com/TryGhost/Ghost.git|yes|no|Publishing + monetization reference"
  "n8n|https://github.com/n8n-io/n8n.git|yes|yes|Automation patterns"
  "Chatwoot|https://github.com/chatwoot/chatwoot.git|yes|no|Support/CRM reference"
  "LangChain|https://github.com/langchain-ai/langchain.git|yes|no|LLM orchestration reference"
  "302_coder_generator|https://github.com/302ai/302_coder_generator.git|yes|yes|Landing-page generation reference"
  "aipage.dev|https://github.com/zinedkaloc/aipage.dev.git|yes|yes|AI page builder reference"
  "Ai-Website-Builder|https://github.com/Ratna-Babu/Ai-Website-Builder.git|yes|yes|AI website workflow"
  "nextjs-shopify|https://github.com/BuilderIO/nextjs-shopify.git|yes|yes|Shopify + Next reference"
  "Shopify-Product-Generator|https://github.com/ChristineShaffer/Shopify-Product-Generator.git|yes|yes|Product copy generation"
  "Firecrawl|https://github.com/mendableai/firecrawl.git|yes|yes|Site extraction/reference ingest"
  "awesome-claude-code-subagents|https://github.com/VoltAgent/awesome-claude-code-subagents.git|yes|yes|Agent workflow catalog"
  "claude-mem|https://github.com/thedotmack/claude-mem.git|yes|yes|Persistent memory pattern"
  "vercel-labs-skills|https://github.com/vercel-labs/skills.git|yes|yes|Skills system reference"
  "skills-cli|https://github.com/kcchien/skills-cli.git|yes|yes|Skills CLI patterns"
  "ccpm|https://github.com/automazeio/ccpm.git|yes|yes|Execution/project mgmt reference"
  "mcp-servers|https://github.com/modelcontextprotocol/servers.git|yes|yes|MCP integrations"
  "claude-code-hooks|https://github.com/shanraisshan/claude-code-hooks.git|yes|yes|Hook enforcement patterns"
  "claude-code-best-practice|https://github.com/shanraisshan/claude-code-best-practice.git|yes|yes|Prompt/process patterns"
  "everything-claude-code|https://github.com/affaan-m/everything-claude-code.git|yes|yes|Knowledge base"
  "superpowers|https://github.com/obra/superpowers.git|yes|yes|Agentic utilities"
  "get-shit-done|https://github.com/gsd-build/get-shit-done.git|yes|yes|Execution framework"
  "spec-kit|https://github.com/github/spec-kit.git|yes|yes|Spec-first development"
  "claude-ads|https://github.com/AgriciDaniel/claude-ads.git|yes|yes|Ads agent reference"
  "go-task|https://github.com/go-task/task.git|yes|yes|Task runner"
  "mise|https://github.com/jdx/mise.git|yes|yes|Runtime manager"
  "lefthook|https://github.com/evilmartians/lefthook.git|yes|yes|Git hook runner"
  "uv|https://github.com/astral-sh/uv.git|yes|yes|Python package/runtime tooling"
  "ruff|https://github.com/astral-sh/ruff.git|yes|yes|Lint+format"
  "biome|https://github.com/biomejs/biome.git|yes|yes|JS lint+format"
  "nx|https://github.com/nrwl/nx.git|yes|yes|Monorepo orchestration"
  "supabase-cli|https://github.com/supabase/cli.git|yes|no|Backend/db ops tooling"
  "stripe-cli|https://github.com/stripe/stripe-cli.git|yes|no|Payments local testing"
  "googleworkspace-cli|https://github.com/googleworkspace/cli.git|yes|no|Workspace automations"
  "CLI-Anything|https://github.com/HKUDS/CLI-Anything.git|yes|no|CLI generation reference"
  "playwright-cli|https://github.com/microsoft/playwright-cli.git|yes|yes|E2E/browser automation"
  "notebooklm-py|https://github.com/teng-lin/notebooklm-py.git|yes|no|Research assistant reference"
  "setup-uv|https://github.com/astral-sh/setup-uv.git|yes|no|CI action reference"
  "ruff-action|https://github.com/astral-sh/ruff-action.git|yes|no|CI lint action"
  "setup-task|https://github.com/go-task/setup-task.git|yes|no|CI task action"
  "mise-action|https://github.com/jdx/mise-action.git|yes|no|CI runtime action"
)

{
  echo "# Bootstrap References Status"
  echo
  echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo
  echo "| Tool/Repo | Relevant? | Installed? | Cloned? | Verified? | Used in plan? | Notes |"
  echo "|---|---|---|---|---|---|---|"

  for row in "${items[@]}"; do
    IFS='|' read -r name url relevant used notes <<< "$row"
    dir="$REF_DIR/$name"

    cloned="no"
    verified="no"
    install_state="n/a"
    note="$notes"

    if [[ -d "$dir/.git" ]]; then
      cloned="already"
      if git -C "$dir" rev-parse --short HEAD >/dev/null 2>&1; then
        verified="yes"
      fi
    else
      if git clone --depth 1 --filter=blob:none "$url" "$dir" >/dev/null 2>&1; then
        cloned="yes"
        if git -C "$dir" rev-parse --short HEAD >/dev/null 2>&1; then
          verified="yes"
        fi
      else
        cloned="no"
        verified="no"
        note="$notes; clone blocked (network/auth/repo issue)"
      fi
    fi

    echo "| $name | $relevant | $install_state | $cloned | $verified | $used | $note |"
  done

  echo
  echo "## Non-Git URL References (documented, not cloneable)"
  echo
  echo "| Tool/Repo | Relevant? | Installed? | Cloned? | Verified? | Used in plan? | Notes |"
  echo "|---|---|---|---|---|---|---|"
  echo "| skills.sh | yes | n/a | no | yes | yes | Website reference; not a git repo URL. |"
  echo "| TikTok Creative Center | yes | n/a | no | yes | yes | Product inspiration URL; no git clone target. |"
  echo "| 21st.dev components | yes | n/a | no | yes | yes | UI inspiration URL; no git clone target. |"
  echo "| TRELLIS | yes | n/a | no | yes | yes | Docs/demo URL; not cloned as repo in this pass. |"
  echo "| Google Labs Pommelly | yes | n/a | no | yes | yes | Product inspiration URL; not clone target. |"
  echo "| nas.io | yes | n/a | no | yes | yes | Product reference URL; not clone target. |"
  echo "| pagepilot.ai | yes | n/a | no | yes | yes | Product reference URL; not clone target. |"
  echo "| Vercel CLI package URL | yes | n/a | no | yes | yes | Package install path, not repo clone request. |"
} > "$REPORT"

echo "Wrote $REPORT"
