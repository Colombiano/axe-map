#!/usr/bin/env python3
"""
Script de deploy automático do Axé Map para o GitHub.
Cria/atualiza um repositório e faz push dos arquivos.
"""

import subprocess
import sys
import os


def run_command(cmd: str, cwd: str = None) -> tuple[int, str, str]:
    """Run a shell command and return exit code, stdout, stderr."""
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
        cwd=cwd
    )
    return result.returncode, result.stdout, result.stderr


def deploy_to_github(repo_name: str = "axe-map", username: str = None) -> bool:
    """
    Deploy the Axé Map project to GitHub.
    
    Args:
        repo_name: Name of the GitHub repository
        username: GitHub username (optional, will try to detect)
    
    Returns:
        bool: True if successful, False otherwise
    """
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    print("=" * 60)
    print("🕯️ Axé Map - Deploy para GitHub")
    print("=" * 60)
    
    # Detect username from git config if not provided
    if not username:
        code, stdout, _ = run_command("git config user.name")
        if code == 0 and stdout.strip():
            username = stdout.strip()
        else:
            print("❌ Não foi possível detectar o usuário do Git.")
            print("   Configure com: git config --global user.name 'seu-usuario'")
            return False
    
    print(f"\n📁 Projeto: {project_root}")
    print(f"🐙 GitHub: {username}/{repo_name}")
    
    # Check if git is initialized
    code, _, _ = run_command("git rev-parse --git-dir", cwd=project_root)
    
    if code != 0:
        print("\n🔧 Inicializando repositório git...")
        run_command("git init", cwd=project_root)
        run_command("git branch -M main", cwd=project_root)
    
    # Check if remote exists
    code, stdout, _ = run_command("git remote -v", cwd=project_root)
    
    remote_url = f"https://github.com/{username}/{repo_name}.git"
    
    if "origin" in stdout:
        print("\n🔄 Atualizando remote origin...")
        run_command(f"git remote set-url origin {remote_url}", cwd=project_root)
    else:
        print(f"\n➕ Adicionando remote origin...")
        run_command(f"git remote add origin {remote_url}", cwd=project_root)
    
    # Create .gitignore if not exists
    gitignore_path = os.path.join(project_root, ".gitignore")
    if not os.path.exists(gitignore_path):
        print("\n📝 Criando .gitignore...")
        with open(gitignore_path, "w") as f:
            f.write("""
# Dependencies
node_modules/
backend/venv/
__pycache__/
*.pyc

# Build
dist/

# Environment
.env
.env.local

# Database
data/
*.db
*.sqlite

# Uploads
uploads/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
""")
    
    # Stage files
    print("\n📦 Adicionando arquivos...")
    run_command("git add .", cwd=project_root)
    
    # Check if there are changes to commit
    code, stdout, _ = run_command("git status --porcelain", cwd=project_root)
    
    if not stdout.strip():
        print("\n✅ Nada para commitar. Tudo está atualizado!")
    else:
        print("\n💾 Criando commit...")
        code, _, stderr = run_command(
            'git commit -m "🕯️ Axé Map - Mapeamento dos Terreiros de Candomblé"',
            cwd=project_root
        )
        
        if code != 0:
            print(f"❌ Erro no commit: {stderr}")
            return False
        
        print("\n🚀 Fazendo push para o GitHub...")
        code, stdout, stderr = run_command(
            "git push -u origin main",
            cwd=project_root
        )
        
        if code != 0:
            print(f"❌ Erro no push: {stderr}")
            print("\n💡 Dicas:")
            print("   1. Verifique suas credenciais do GitHub")
            print("   2. Certifique-se de que o repositório existe no GitHub")
            print(f"   3. Crie o repositório em: https://github.com/new")
            return False
        
        print("\n✅ Deploy realizado com sucesso!")
    
    print(f"\n🌐 URL do repositório:")
    print(f"   https://github.com/{username}/{repo_name}")
    print(f"\n🗺️ Para GitHub Pages:")
    print(f"   https://{username}.github.io/{repo_name}")
    
    print("\n" + "=" * 60)
    print("Saravá! 🕯️")
    print("=" * 60)
    
    return True


def main():
    """Main entry point."""
    print("\n🕯️ Axé Map - Deploy Script\n")
    
    # Get repository name
    repo_name = input("Nome do repositório [axe-map]: ").strip() or "axe-map"
    
    # Get username
    code, stdout, _ = run_command("git config user.name")
    default_username = stdout.strip() if code == 0 else ""
    
    if default_username:
        username = input(f"Usuário do GitHub [{default_username}]: ").strip() or default_username
    else:
        username = input("Usuário do GitHub: ").strip()
    
    if not username:
        print("❌ Usuário é obrigatório!")
        sys.exit(1)
    
    # Deploy
    success = deploy_to_github(repo_name, username)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
