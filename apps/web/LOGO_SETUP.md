# 🎨 Configuration du Logo TradeLink

## Étapes pour ajouter le logo

### Option 1 : Via Interface (Recommandé)
1. Ouvrir l'explorateur de fichiers de votre éditeur
2. Naviguer vers `apps/web/public/`
3. Glisser-déposer l'image du logo dans ce dossier
4. Renommer le fichier en `logo.png`

### Option 2 : Via Terminal
```bash
# Depuis la racine du projet
cp /chemin/vers/votre/logo.png "apps/web/public/logo.png"
```

### Option 3 : Via Download
Si le logo est en ligne :
```bash
cd "apps/web/public"
wget -O logo.png "URL_DU_LOGO"
# ou
curl -o logo.png "URL_DU_LOGO"
```

## Spécifications recommandées

- **Format** : PNG avec fond transparent
- **Dimensions** : 800x280px (ratio ~3:1)
- **Poids** : < 200 KB optimisé
- **Qualité** : Haute résolution pour affichage Retina

## Utilisations dans l'application

Le logo est utilisé dans :
- ✅ Landing page (header)
- ✅ Page de connexion
- ✅ Page d'inscription
- ✅ Sidebar du dashboard
- ✅ Composant réutilisable `<Logo />`

## Variantes disponibles

### Logo complet
```tsx
<Logo variant="full" width={180} height={60} />
```

### Icône seule
```tsx
<Logo variant="icon" width={40} height={40} />
```

## Vérification

Après avoir ajouté le logo, vérifiez sur :
- http://localhost:3000 (Landing page)
- http://localhost:3000/login (Login)
- http://localhost:3000/register (Register)
- http://localhost:3000/dashboard (Sidebar)

## Fallback

Si le logo n'apparaît pas :
1. Vérifier que le fichier existe : `ls apps/web/public/logo.png`
2. Vérifier les permissions : `chmod 644 apps/web/public/logo.png`
3. Redémarrer le serveur Next.js : `Ctrl+C` puis `pnpm dev`
4. Vider le cache du navigateur : `Ctrl+Shift+R`

## Optimisation (optionnel)

Pour optimiser le logo :
```bash
# Installer ImageMagick
sudo apt install imagemagick

# Optimiser
convert logo.png -resize 800x280 -quality 85 logo-optimized.png
```

---

**Note** : Le logo actuel dans `public/logo.png` est un placeholder. Remplacez-le par votre vrai logo.
