# Mafija Website - Nuotraukų įkėlimo instrukcijos

## Nuotraukų aplankų struktūra

```
images/
├── hero/
│   └── hero-bg.jpg           (Fonas pagrindinei hero sekcijai)
├── services/
│   ├── service-1.jpg         (Žaidimo organizavimas)
│   ├── service-2.jpg         (Renginio organizavimas)
│   └── service-3.jpg         (Atributikos nuoma)
├── gallery/
│   ├── gallery-1.jpg         (Renginių nuotraukos)
│   ├── gallery-2.jpg
│   └── ... (iki gallery-18.jpg)
├── clients/
│   ├── client-logo-1.png     (Klientų logotipai)
│   ├── client-logo-2.png
│   └── ... (iki client-logo-12.png)
├── team/
│   ├── club.jpg              (Klubo nuotrauka)
│   ├── aleksandr.jpg         (Aleksandras)
│   └── oleg.jpg              (Olegas)
└── reviews/
    ├── review-1.jpg          (Klientų nuotraukos atsiliepimams)
    ├── review-2.jpg
    └── ... (iki review-9.jpg)
```

## Nuotraukų optimizavimo rekomendacijos

### Dydžiai:
- **Hero fonas**: 1920x1080px (arba daugiau modernių ekranams)
- **Paslaugų nuotraukos**: 800x600px
- **Galerijos nuotraukos**: 1200x1200px (kvadratinės)
- **Klientų logotipai**: 300x200px (permatomas PNG fonas)
- **Komandos nuotraukos**: 600x600px (kvadratinės)
- **Atsiliepimų nuotraukos**: 200x200px (kvadratinės)

### Formatai:
- Nuotraukos: `.jpg` (kokybė 85%)
- Logotipai: `.png` (su permatom u fonu)

### Optimizacija:
- Maksimalus failo dydis: **500KB**
- Naudokite suspaudimo įrankius: TinyPNG, ImageOptim arba internetines paslaugas

## Kaip įkelti nuotraukas į GitHub

### 1 variantas: Per GitHub internetinę sąsają
1. Atidarykite savo repository github.com
2. Eikite į reikiamą aplanką (pvz., `images/gallery`)
3. Paspauskite "Add file" → "Upload files"
4. Nutempkite nuotraukas arba pasirinkite iš kompiuterio
5. Paspauskite "Commit changes"
6. Palaukite 1-2 minutes - svetainė automatiškai atsinaujins

### 2 variantas: Per GitHub Desktop (patogiau dideliam kiekiui)
1. Atidarykite GitHub Desktop
2. Nukopijuokite nuotraukas į atitinkamus aplankus kompiuteryje
3. GitHub Desktop parodys pakeitimus
4. Parašykite aprašymą (pvz., "Pridėtos galerijos nuotraukos")
5. Paspauskite "Commit to main"
6. Paspauskite "Push origin"

## Svarbu žinoti

- **Failų pavadinimai**: Naudokite tik lotyniškus raidžius, skaičius ir brūkšnelius
- **Geri pavadinimai**: `gallery-1.jpg`, `team-oleg.jpg`, `client-logo-company.png`
- **Blogi pavadinimai**: `Nuotrauka 1.jpg`, `IMG_0123.JPG`, `nauja nuotrauka.png`

- **Failų dydžiai**: Jei failas didesnis nei 500KB, suspaus kite jį prieš įkeliant

- **Prioritetas**:
  1. Hero fonas (hero-bg.jpg) - svarbu pirmam įspūdžiui
  2. Paslaugų nuotraukos (service-1.jpg, service-2.jpg, service-3.jpg)
  3. Komandos nuotraukos (aleksandr.jpg, oleg.jpg, club.jpg)
  4. Galerijos nuotraukos
  5. Klientų logotipai
  6. Atsiliepimų nuotraukos

## Testavimas po įkėlimo

1. Palaukite 1-2 minutes po įkėlimo
2. Atnaujinkite svetainę (Ctrl+F5 arba Cmd+Shift+R)
3. Patikrinkite, ar nuotraukos rodomos teisingai
4. Jei nuotrauka nerodoma - patikrinkite failo pavadinimą kode

## Pagalba

Jei kyla problemų:
1. Patikrinkite failų pavadinimus (tik lotyniškas, be tarpų)
2. Patikrinkite failų dydžius (ne daugiau 5MB GitHub'e)
3. Įsitikinkite, kad nuotraukos teisingame aplanke
4. Palaukite kelias minutes - GitHub Pages atsinaujina ne iš karto

Jei niekas nepadeda - parašykite Claude, aš padėsiu išspręsti problemą! 🙂