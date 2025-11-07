# Résolution du problème d'authentification Git

## Problème

```
fatal: Authentication failed for 'https://github.com/eulogetabala/instantmobile.git/'
```

## Solutions

### Solution 1 : Utiliser un Personal Access Token (Recommandé)

1. **Créer un Personal Access Token sur GitHub :**
   - Allez sur GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Cliquez sur "Generate new token (classic)"
   - Donnez un nom (ex: "EAS Build")
   - Sélectionnez les scopes : `repo` (toutes les permissions)
   - Cliquez sur "Generate token"
   - **Copiez le token** (vous ne pourrez plus le voir après)

2. **Utiliser le token lors du push :**
   ```bash
   git push https://VOTRE_TOKEN@github.com/eulogetabala/instantmobile.git
   ```

3. **Ou configurer Git pour utiliser le token :**
   ```bash
   git remote set-url origin https://VOTRE_TOKEN@github.com/eulogetabala/instantmobile.git
   git push
   ```

### Solution 2 : Utiliser SSH au lieu de HTTPS

1. **Vérifier si vous avez une clé SSH :**
   ```bash
   ls -la ~/.ssh
   ```

2. **Si vous n'avez pas de clé SSH, en créer une :**
   ```bash
   ssh-keygen -t ed25519 -C "votre_email@example.com"
   # Appuyez sur Entrée pour accepter l'emplacement par défaut
   # Entrez un mot de passe (optionnel)
   ```

3. **Ajouter la clé SSH à votre agent :**
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

4. **Copier la clé publique :**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Copiez tout le contenu affiché
   ```

5. **Ajouter la clé sur GitHub :**
   - Allez sur GitHub.com → Settings → SSH and GPG keys
   - Cliquez sur "New SSH key"
   - Collez votre clé publique
   - Cliquez sur "Add SSH key"

6. **Changer l'URL du remote vers SSH :**
   ```bash
   git remote set-url origin git@github.com:eulogetabala/instantmobile.git
   git push
   ```

### Solution 3 : Utiliser GitHub CLI

Si vous avez GitHub CLI installé :

```bash
gh auth login
# Suivez les instructions
git push
```

### Solution 4 : Commit localement seulement (pour tester)

Si vous voulez juste tester localement sans push :

```bash
git add package-lock.json package.json .npmrc
git commit -m "Fix: Add missing dependencies for EAS Build compatibility"
# Le commit est local, vous pourrez push plus tard
```

## Vérification

Après avoir configuré l'authentification, testez avec :

```bash
git push --dry-run
```

Si cela fonctionne, faites le vrai push :

```bash
git push
```

## Note importante

Pour EAS Build, vous n'avez pas besoin de push immédiatement si vous testez localement. Mais pour que EAS Build utilise les nouveaux fichiers, vous devrez les pousser dans le dépôt.

