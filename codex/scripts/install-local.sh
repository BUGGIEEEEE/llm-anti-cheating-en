#!/usr/bin/env bash
set -euo pipefail

codex_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$codex_root"
dest="${CODEX_PLUGIN_INSTALL_DIR:-$HOME/plugins/llm-anti-cheating}"
marketplace="${CODEX_MARKETPLACE_FILE:-$HOME/.agents/plugins/marketplace.json}"

if [[ ! -f "$src/.codex-plugin/plugin.json" ]]; then
  echo "Missing plugin source at $src" >&2
  exit 1
fi

mkdir -p "$dest"
cp -R "$src"/. "$dest"/

mkdir -p "$(dirname "$marketplace")"

node - "$marketplace" <<'NODE'
const fs = require('fs');
const path = require('path');

const marketplaceFile = process.argv[2];
let data;

if (fs.existsSync(marketplaceFile)) {
  data = JSON.parse(fs.readFileSync(marketplaceFile, 'utf8'));
} else {
  data = {
    name: 'local-codex-plugins',
    interface: { displayName: 'Local Codex Plugins' },
    plugins: [],
  };
}

if (!data.interface) data.interface = { displayName: 'Local Codex Plugins' };
if (!Array.isArray(data.plugins)) data.plugins = [];

const entry = {
  name: 'llm-anti-cheating',
  source: {
    source: 'local',
    path: './plugins/llm-anti-cheating',
  },
  policy: {
    installation: 'AVAILABLE',
    authentication: 'ON_INSTALL',
  },
  category: 'Productivity',
};

const existing = data.plugins.findIndex((plugin) => plugin && plugin.name === entry.name);
if (existing >= 0) {
  data.plugins[existing] = entry;
} else {
  data.plugins.push(entry);
}

fs.writeFileSync(marketplaceFile, JSON.stringify(data, null, 2) + '\n');
NODE

echo "Installed llm-anti-cheating plugin to: $dest"
echo "Registered marketplace entry at: $marketplace"
echo "Restart Codex or reload plugins so the new plugin is discovered."
