# Scripts Directory

This directory contains utility scripts for the AWS AI Chat project.

## Available Scripts

### `verify-gitignore.sh`

Verifies that the `.gitignore` file is properly configured and no sensitive files are being tracked by git.

**Usage:**
```bash
./scripts/verify-gitignore.sh
```

**What it checks:**
- Environment files (`.env*` except `.env.example`)
- Log files (`*.log`)
- AWS credentials and configuration files
- Certificate and key files (`.pem`, `.key`, `.p12`, etc.)
- Generated files (`*.generated`)
- Git tracking status of sensitive files

**When to run:**
- Before committing changes
- After adding new environment variables
- When setting up the project for the first time
- Before sharing the repository

**Example output:**
```
✅ .gitignore verification passed! No sensitive files detected.
```

## Security Best Practices

1. **Always run verification before commits:**
   ```bash
   ./scripts/verify-gitignore.sh && git add . && git commit -m "Your message"
   ```

2. **Never commit these file types:**
   - `.env*` (except `.env.example`)
   - `*.log`
   - `*.pem`, `*.key`, `*.p12` (certificates/keys)
   - AWS credentials or config files
   - Generated configuration files

3. **Use example files for documentation:**
   - `.env.example` instead of `.env`
   - Document required environment variables
   - Provide placeholder values

## Adding New Scripts

When adding new scripts to this directory:

1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add proper error handling and user feedback
3. Document the script in this README
4. Follow the existing naming convention
5. Include usage examples
