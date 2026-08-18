#!/usr/bin/env python3
"""Extrait le mémoire (version publique, 124 p.) en structure exploitable.

    static/memoire-…-2025.pdf  ──▶  build/memoire.json

Méthode
-------
`pdftohtml -xml` restitue chaque fragment de texte avec sa position et sa
police. Or dans ce document, produit par Word, la hiérarchie des titres est
encodée dans la police et la couleur, de façon parfaitement régulière :

    20pt F6/F2 bleu #4f81bd   Introduction, PARTIE I-III, Conclusion, Annexes
    18pt F2    bleu           Annexe 1 à 6 (niveau section)
    18pt F6    bleu           sections « 1.3. » et intertitres non numérotés
    18pt F7    bleu           sous-sections « 1.3.2. »
    18pt F5    bleu           sous-sous-sections « 1.3.2.1. »
    18pt F11   bleu           intertitres internes aux annexes
    18pt F7    bleu foncé     légendes de tableaux et figures
    18pt F1/F3 #244061        pieds de page (rejetés)
    18pt F5    noir           corps de texte
    18pt F6    noir           gras — en pratique, en-têtes de tableaux

Les frontières de paragraphes, absentes du PDF, sont reconstituées par le bord
droit : une ligne qui s'arrête nettement avant la marge termine un paragraphe.

Les tableaux sont repérés (lignes à plusieurs colonnes) et remplacés par un
marqueur. Ils sont repris à la main dans src/memoire/tableaux/ : leur
reconstitution automatique n'est pas assez sûre pour un texte de recherche.

Limite connue : le PDF n'expose aucune police italique distincte. L'emphase
typographique du document d'origine n'est donc pas récupérable.
"""

import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "static" / "memoire-communs-numeriques-berge-2025.pdf"
OUT = ROOT / "build" / "memoire.json"

PREMIERE, DERNIERE = 8, 124

# (taille, famille, couleur) → rôle
ROLES = {
    (20, "CIDFont+F6", "#4f81bd"): "h1",
    (20, "CIDFont+F2", "#4f81bd"): "h1",
    (18, "CIDFont+F2", "#4f81bd"): "h2",   # « Annexe 1 » … « Annexe 6 »
    (18, "CIDFont+F6", "#4f81bd"): "h2",
    (18, "CIDFont+F7", "#4f81bd"): "h3",
    (18, "CIDFont+F5", "#4f81bd"): "h4",
    (18, "CIDFont+F11", "#4f81bd"): "h3",
    (18, "CIDFont+F7", "#365f91"): "legende",
}
PIED_COULEURS = {"#244061"}

NUMEROTE = re.compile(r"^(\d+(?:\.\d+)*)\.?\s+(.*)$", re.S)
LEGENDE = re.compile(r"^(Tableau|Figure)\s*(\d+)\s*[:–-]\s*(.*)$", re.S | re.I)
PUCE = re.compile(r"^\s*[•▪◦–—]\s+")
PIED_TXT = re.compile(r"Executive Master 2|^Page$|^\d+$|^sur$|^206$")


def nettoyer(t):
    """Recolle un texte issu de la mise en colonne du PDF."""
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"(\w)‐\s+(\w)", r"\1\2", t)
    t = re.sub(r"\s+([;:!?%])", r" \1", t)      # espace fine insécable
    t = re.sub(r"«\s+", "« ", t)
    t = re.sub(r"\s+»", " »", t)
    t = t.replace(" ,", ",").replace(" .", ".")
    return t


def charger_runs():
    """[(page, top, left, right, role, texte)] pour tout le document."""
    xml = subprocess.run(["pdftohtml", "-xml", "-i", "-nodrm", "-q", "-stdout", str(PDF)],
                         capture_output=True, text=True, check=True).stdout
    root = ET.fromstring(xml)
    specs = {f.get("id"): (int(f.get("size")), f.get("family"), f.get("color"))
             for f in root.iter("fontspec")}

    runs = []
    for n, page in enumerate(root.iter("page"), start=1):
        if not (PREMIERE <= n <= DERNIERE):
            continue
        for t in page.iter("text"):
            txt = "".join(t.itertext())
            if not txt.strip():
                continue
            spec = specs[t.get("font")]
            if spec[2] in PIED_COULEURS or PIED_TXT.match(txt.strip()):
                continue
            left, top = int(t.get("left")), int(t.get("top"))
            runs.append({
                "page": n, "top": top, "left": left, "right": left + int(t.get("width")),
                "role": ROLES.get(spec, "corps"), "gras": spec[1] == "CIDFont+F6" and spec[2] == "#000000",
                "texte": txt,
            })
    return runs


def grouper_lignes(runs):
    """Regroupe les fragments d'une même ligne (même ordonnée à 3 px près)."""
    par_page = defaultdict(list)
    for r in runs:
        par_page[r["page"]].append(r)

    lignes = []
    for page in sorted(par_page):
        rs = sorted(par_page[page], key=lambda r: (r["top"], r["left"]))
        courant = []
        for r in rs:
            if courant and abs(r["top"] - courant[0]["top"]) <= 3:
                courant.append(r)
            else:
                if courant:
                    lignes.append(assembler(courant))
                courant = [r]
        if courant:
            lignes.append(assembler(courant))
    return lignes


def assembler(runs):
    runs = sorted(runs, key=lambda r: r["left"])
    # Un grand écart horizontal entre deux fragments signale des colonnes
    ecarts = [runs[i + 1]["left"] - runs[i]["right"] for i in range(len(runs) - 1)]
    colonnes = sum(1 for e in ecarts if e > 28)
    return {
        "page": runs[0]["page"], "top": runs[0]["top"],
        "left": runs[0]["left"], "right": max(r["right"] for r in runs),
        "role": runs[0]["role"], "colonnes": colonnes,
        "gras": all(r["gras"] for r in runs),
        "texte": " ".join(r["texte"].strip() for r in runs if r["texte"].strip()),
    }


def marge_droite(lignes):
    """Bord droit du bloc de texte courant, par page."""
    par_page = defaultdict(list)
    for l in lignes:
        if l["role"] == "corps" and l["colonnes"] == 0:
            par_page[l["page"]].append(l["right"])
    globale = max((r for v in par_page.values() for r in v), default=0)
    return {p: max(v) for p, v in par_page.items()}, globale


def main():
    if not PDF.exists():
        sys.exit(f"PDF introuvable : {PDF}")

    lignes = grouper_lignes(charger_runs())
    marges, marge_globale = marge_droite(lignes)

    elements = []
    para, tableau = [], []
    liste_left = [None]          # abscisse de la puce en cours, s'il y en a une

    def vider_para():
        if para:
            elements.append({"type": "para", "texte": nettoyer(" ".join(para)),
                             "page": page_para[0]})
            para.clear()

    def vider_tableau():
        if tableau:
            elements.append({"type": "tableau_brut", "page": tableau[0]["page"],
                             "lignes": [l["texte"] for l in tableau]})
            tableau.clear()

    def vider_liste():
        liste_left[0] = None

    page_para = [PREMIERE]

    for l in lignes:
        txt = l["texte"].strip()
        if not txt:
            continue

        # ── Titres ────────────────────────────────────────────────────────────
        if l["role"].startswith("h"):
            vider_para(); vider_tableau(); vider_liste()
            m = NUMEROTE.match(txt)
            elements.append({"type": "titre", "niveau": int(l["role"][1]),
                             "numero": m.group(1) if m else None,
                             "texte": nettoyer(m.group(2) if m else txt),
                             "page": l["page"]})
            page_para[0] = l["page"]
            continue

        # ── Légendes de tableaux et figures ───────────────────────────────────
        if l["role"] == "legende":
            vider_para(); vider_liste()
            m = LEGENDE.match(txt)
            if m:
                vider_tableau()
                elements.append({"type": "legende", "objet": m.group(1).lower(),
                                 "num": int(m.group(2)), "texte": nettoyer(m.group(3)),
                                 "page": l["page"]})
            else:
                for e in reversed(elements):      # légende sur deux lignes
                    if e["type"] == "legende":
                        e["texte"] = nettoyer(e["texte"] + " " + txt)
                        break
            continue

        # ── Listes à puces ────────────────────────────────────────────────────
        # À tester avant les tableaux : l'indentation d'une puce crée un écart
        # horizontal que la détection de colonnes prendrait pour un tableau.
        if PUCE.match(txt):
            vider_para(); vider_tableau()
            item = nettoyer(PUCE.sub("", txt))
            if liste_left[0] is not None and elements and elements[-1]["type"] == "liste":
                elements[-1]["items"].append(item)
            else:
                elements.append({"type": "liste", "items": [item], "page": l["page"]})
            liste_left[0] = l["left"]
            continue

        # Ligne indentée sous une puce : suite de l'item précédent
        if (liste_left[0] is not None and l["left"] > liste_left[0] + 5
                and elements and elements[-1]["type"] == "liste"):
            elements[-1]["items"][-1] = nettoyer(elements[-1]["items"][-1] + " " + txt)
            continue
        vider_liste()

        # ── Lignes de tableau : plusieurs colonnes séparées par de grands écarts
        if l["colonnes"] >= 1:
            vider_para()
            tableau.append(l)
            continue
        if tableau and len(txt.split()) <= 6:
            tableau.append(l)                     # cellule sur une seule colonne
            continue
        vider_tableau()

        # ── Corps de texte : accumulation jusqu'à une ligne courte ─────────────
        if not para:
            page_para[0] = l["page"]
        para.append(txt)
        if l["right"] < marges.get(l["page"], marge_globale) - 22:
            vider_para()

    vider_para()
    vider_tableau()

    # Dans ce document, la légende suit toujours l'objet qu'elle décrit. On
    # remonte donc depuis chaque légende « Tableau N » pour absorber les lignes
    # du tableau et les cellules isolées que la détection par colonnes a
    # laissées passer — jusqu'à retomber sur de la prose ou un titre.
    for i, e in enumerate(elements):
        if e["type"] != "legende" or e["objet"] != "tableau":
            continue
        j = i - 1
        while j >= 0:
            c = elements[j]
            if c["type"] == "tableau_brut":
                j -= 1
            elif c["type"] == "para" and len(c["texte"]) < 90:
                j -= 1
            else:
                break
        if j + 1 < i:
            lignes_tab = []
            for c in elements[j + 1:i]:
                lignes_tab += c.get("lignes", []) or [c.get("texte", "")]
            elements[j + 1] = {"type": "tableau", "num": e["num"], "page": e["page"],
                               "legende": e["texte"], "lignes": lignes_tab}
            for k in range(j + 2, i + 1):
                elements[k] = None
    elements = [e for e in elements if e is not None]

    # Les figures sont des images : la légende seule subsiste dans le flux.
    for i, e in enumerate(elements):
        if e["type"] == "legende" and e["objet"] == "figure":
            elements[i] = {"type": "figure", "num": e["num"], "page": e["page"],
                           "legende": e["texte"]}

    # Un titre trop long pour une ligne produit deux éléments consécutifs de
    # même niveau : on les recolle. Deux titres distincts sont toujours séparés
    # par du texte, donc jamais adjacents dans la liste.
    fusionnes = []
    for e in elements:
        if (fusionnes and e["type"] == "titre" and fusionnes[-1]["type"] == "titre"
                and e["niveau"] == fusionnes[-1]["niveau"]
                and e["numero"] is None):
            fusionnes[-1]["texte"] = nettoyer(fusionnes[-1]["texte"] + " " + e["texte"])
            continue
        fusionnes.append(e)
    elements = fusionnes

    OUT.write_text(json.dumps(elements, ensure_ascii=False, indent=1), encoding="utf-8")

    compte = defaultdict(int)
    for e in elements:
        compte[e["type"]] += 1
    mots = sum(len(e.get("texte", "").split()) for e in elements if e["type"] == "para")
    print(f"{len(elements)} éléments → {OUT.relative_to(ROOT)}")
    for t in sorted(compte):
        print(f"  {t:<14} {compte[t]}")
    print(f"  {'mots (prose)':<14} {mots}")

    niveaux = defaultdict(int)
    for e in elements:
        if e["type"] == "titre":
            niveaux[e["niveau"]] += 1
    print("  titres :", ", ".join(f"h{k}={v}" for k, v in sorted(niveaux.items())))


if __name__ == "__main__":
    main()
