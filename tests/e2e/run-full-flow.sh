#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          EVALUP E2E FULL FLOW TEST                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Vérifier que le serveur est en cours
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "⚠️  Le serveur n'est pas lancé."
  echo "   Lance 'npm run dev' dans un autre terminal."
  exit 1
fi

# Vérifier pdftotext pour le parsing PDF
if ! command -v pdftotext &> /dev/null; then
  echo "⚠️  pdftotext non installé — les tests PDF utiliseront le fallback basique."
  echo "   Pour une extraction complète : brew install poppler"
fi

# Créer les dossiers de sortie
mkdir -p tests/screenshots tests/logs tests/reports

# Lancer le test full-flow uniquement
echo ""
echo "🚀 Lancement du test full-flow..."
echo ""

tsx tests/run-tests.ts full-flow

echo ""
echo "✅ Tests terminés."
echo "📸 Screenshots: tests/screenshots/"
echo "📋 Logs: tests/logs/"
echo "📄 Reports: tests/reports/"
