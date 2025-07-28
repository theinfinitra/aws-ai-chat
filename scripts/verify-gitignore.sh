#!/bin/bash

# Verify .gitignore is properly configured
# This script helps ensure sensitive files are not accidentally committed

echo "🔍 Verifying .gitignore configuration..."

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo "❌ .gitignore file not found!"
    exit 1
fi

# Check for sensitive files that should be ignored
echo "📋 Checking for sensitive files that should be ignored..."

SENSITIVE_FILES_FOUND=0

# Check for environment files
if ls .env* 2>/dev/null | grep -v "\.example$" >/dev/null; then
    echo "⚠️  Environment files found (should be ignored):"
    ls .env* 2>/dev/null | grep -v "\.example$" | sed 's/^/   /'
    SENSITIVE_FILES_FOUND=1
fi

# Check for log files
if ls *.log 2>/dev/null >/dev/null; then
    echo "⚠️  Log files found (should be ignored):"
    ls *.log 2>/dev/null | sed 's/^/   /'
    SENSITIVE_FILES_FOUND=1
fi

# Check for AWS credentials
if [ -d ".aws" ] || ls **/credentials 2>/dev/null >/dev/null; then
    echo "⚠️  AWS credentials found (should be ignored):"
    [ -d ".aws" ] && echo "   .aws/"
    ls **/credentials 2>/dev/null | sed 's/^/   /'
    SENSITIVE_FILES_FOUND=1
fi

# Check for certificates and keys
if ls *.pem *.key *.p12 *.pfx 2>/dev/null >/dev/null; then
    echo "⚠️  Certificate/key files found (should be ignored):"
    ls *.pem *.key *.p12 *.pfx 2>/dev/null | sed 's/^/   /'
    SENSITIVE_FILES_FOUND=1
fi

# Check for generated files
if ls *.generated 2>/dev/null >/dev/null; then
    echo "⚠️  Generated files found (should be ignored):"
    ls *.generated 2>/dev/null | sed 's/^/   /'
    SENSITIVE_FILES_FOUND=1
fi

# Check if git is initialized
if [ -d ".git" ]; then
    echo "📊 Checking git status..."
    
    # Check if any sensitive files are tracked
    TRACKED_SENSITIVE=$(git ls-files | grep -E "\.(env|log|pem|key|p12|pfx|generated)$|credentials|config$" || true)
    
    if [ -n "$TRACKED_SENSITIVE" ]; then
        echo "❌ Sensitive files are currently tracked by git:"
        echo "$TRACKED_SENSITIVE" | sed 's/^/   /'
        echo ""
        echo "To remove them from tracking:"
        echo "   git rm --cached <filename>"
        echo "   git commit -m 'Remove sensitive files from tracking'"
        SENSITIVE_FILES_FOUND=1
    fi
    
    # Check for untracked files that should be ignored
    UNTRACKED_SENSITIVE=$(git status --porcelain | grep "^??" | cut -c4- | grep -E "\.(env|log|pem|key|p12|pfx|generated)$|credentials|config$" || true)
    
    if [ -n "$UNTRACKED_SENSITIVE" ]; then
        echo "✅ Sensitive files are properly ignored by git:"
        echo "$UNTRACKED_SENSITIVE" | sed 's/^/   /'
    fi
else
    echo "ℹ️  Git repository not initialized"
fi

# Final result
echo ""
if [ $SENSITIVE_FILES_FOUND -eq 0 ]; then
    echo "✅ .gitignore verification passed! No sensitive files detected."
else
    echo "⚠️  .gitignore verification completed with warnings."
    echo "   Please review the files listed above and ensure they are properly ignored."
fi

echo ""
echo "💡 Remember to:"
echo "   - Never commit .env files (except .env.example)"
echo "   - Keep AWS credentials out of the repository"
echo "   - Exclude log files and generated content"
echo "   - Use .env.example files for documentation"
