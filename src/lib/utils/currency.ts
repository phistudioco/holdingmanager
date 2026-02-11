/**
 * Utilitaires pour les calculs financiers précis
 *
 * Utilise Decimal.js pour éviter les erreurs d'arrondi de JavaScript.
 * TOUJOURS utiliser ces fonctions pour les montants d'argent.
 */

import Decimal from 'decimal.js-light'

// Configuration globale : 2 décimales pour les montants en euros
Decimal.set({
  precision: 20, // Précision interne élevée
  rounding: Decimal.ROUND_HALF_UP, // Arrondi bancaire standard
})

/**
 * Arrondit un nombre à 2 décimales (standard pour les montants en euros)
 *
 * @param value - Nombre à arrondir
 * @returns Nombre arrondi à 2 décimales
 *
 * @example
 * ```typescript
 * roundCurrency(10.335) // 10.34
 * roundCurrency(10.334) // 10.33
 * ```
 */
export function roundCurrency(value: number | string | Decimal): number {
  return new Decimal(value).toDecimalPlaces(2).toNumber()
}

/**
 * Calcule le montant HT d'une ligne de facture
 *
 * @param quantite - Quantité de produits/services
 * @param prixUnitaire - Prix unitaire HT
 * @returns Montant HT arrondi à 2 décimales
 *
 * @example
 * ```typescript
 * calculateMontantHT(3, 10.33) // 30.99
 * calculateMontantHT(7, 1.43) // 10.01
 * ```
 */
export function calculateMontantHT(
  quantite: number | string,
  prixUnitaire: number | string
): number {
  const qty = new Decimal(quantite)
  const price = new Decimal(prixUnitaire)

  return qty.times(price).toDecimalPlaces(2).toNumber()
}

/**
 * Calcule le montant de TVA
 *
 * @param montantHT - Montant hors taxe
 * @param tauxTVA - Taux de TVA en pourcentage (ex: 20 pour 20%)
 * @returns Montant de TVA arrondi à 2 décimales
 *
 * @example
 * ```typescript
 * calculateMontantTVA(100, 20) // 20.00
 * calculateMontantTVA(30.99, 20) // 6.20
 * ```
 */
export function calculateMontantTVA(
  montantHT: number | string,
  tauxTVA: number | string
): number {
  const ht = new Decimal(montantHT)
  const taux = new Decimal(tauxTVA).dividedBy(100)

  return ht.times(taux).toDecimalPlaces(2).toNumber()
}

/**
 * Calcule le montant TTC (HT + TVA)
 *
 * @param montantHT - Montant hors taxe
 * @param montantTVA - Montant de TVA
 * @returns Montant TTC arrondi à 2 décimales
 *
 * @example
 * ```typescript
 * calculateMontantTTC(100, 20) // 120.00
 * calculateMontantTTC(30.99, 6.20) // 37.19
 * ```
 */
export function calculateMontantTTC(
  montantHT: number | string,
  montantTVA: number | string
): number {
  const ht = new Decimal(montantHT)
  const tva = new Decimal(montantTVA)

  return ht.plus(tva).toDecimalPlaces(2).toNumber()
}

/**
 * Calcule une ligne de facture complète (HT, TVA, TTC)
 *
 * @param quantite - Quantité
 * @param prixUnitaire - Prix unitaire HT
 * @param tauxTVA - Taux de TVA en pourcentage
 * @returns Objet avec montant_ht, montant_tva, montant_ttc
 *
 * @example
 * ```typescript
 * calculateLigneFacture(3, 10.33, 20)
 * // { montant_ht: 30.99, montant_tva: 6.20, montant_ttc: 37.19 }
 * ```
 */
export function calculateLigneFacture(
  quantite: number | string,
  prixUnitaire: number | string,
  tauxTVA: number | string
): {
  montant_ht: number
  montant_tva: number
  montant_ttc: number
} {
  const montant_ht = calculateMontantHT(quantite, prixUnitaire)
  const montant_tva = calculateMontantTVA(montant_ht, tauxTVA)
  const montant_ttc = calculateMontantTTC(montant_ht, montant_tva)

  return {
    montant_ht,
    montant_tva,
    montant_ttc,
  }
}

/**
 * Additionne plusieurs montants avec précision
 *
 * @param montants - Liste de montants à additionner
 * @returns Somme arrondie à 2 décimales
 *
 * @example
 * ```typescript
 * sumMontants(10.1, 20.2, 30.3) // 60.60
 * sumMontants(...[1.43, 2.57, 3.99]) // 7.99
 * ```
 */
export function sumMontants(...montants: (number | string)[]): number {
  return montants
    .reduce((sum, montant) => sum.plus(new Decimal(montant)), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber()
}

/**
 * Multiplie un montant par un coefficient
 *
 * @param montant - Montant de base
 * @param coefficient - Coefficient multiplicateur
 * @returns Résultat arrondi à 2 décimales
 *
 * @example
 * ```typescript
 * multiplyMontant(10.33, 1.2) // 12.40
 * ```
 */
export function multiplyMontant(
  montant: number | string,
  coefficient: number | string
): number {
  const m = new Decimal(montant)
  const c = new Decimal(coefficient)

  return m.times(c).toDecimalPlaces(2).toNumber()
}

/**
 * Divise un montant par un diviseur
 *
 * @param montant - Montant à diviser
 * @param diviseur - Diviseur
 * @returns Résultat arrondi à 2 décimales
 *
 * @example
 * ```typescript
 * divideMontant(100, 3) // 33.33
 * ```
 */
export function divideMontant(
  montant: number | string,
  diviseur: number | string
): number {
  const m = new Decimal(montant)
  const d = new Decimal(diviseur)

  if (d.isZero()) {
    throw new Error('Division par zéro impossible')
  }

  return m.dividedBy(d).toDecimalPlaces(2).toNumber()
}

/**
 * Formate un montant pour affichage avec le symbole euro
 *
 * @param montant - Montant à formater
 * @param options - Options de formatage
 * @returns Chaîne formatée (ex: "1 234,56 €")
 *
 * @example
 * ```typescript
 * formatCurrency(1234.56) // "1 234,56 €"
 * formatCurrency(0, { showZero: false }) // "-"
 * ```
 */
export function formatCurrency(
  montant: number | string | null | undefined,
  options: {
    showZero?: boolean // Afficher "0,00 €" ou "-" pour les montants nuls
    showSymbol?: boolean // Afficher le symbole €
  } = {}
): string {
  const { showZero = true, showSymbol = true } = options

  if (montant === null || montant === undefined) {
    return showZero ? (showSymbol ? '0,00 €' : '0,00') : '-'
  }

  const value = new Decimal(montant).toDecimalPlaces(2).toNumber()

  if (value === 0 && !showZero) {
    return '-'
  }

  const formatted = new Intl.NumberFormat('fr-FR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  return formatted
}

/**
 * Calcule un pourcentage d'un montant
 *
 * @param montant - Montant de base
 * @param pourcentage - Pourcentage à appliquer (ex: 15 pour 15%)
 * @returns Résultat arrondi à 2 décimales
 *
 * @example
 * ```typescript
 * calculatePercentage(1000, 15) // 150.00
 * calculatePercentage(99.99, 5) // 5.00
 * ```
 */
export function calculatePercentage(
  montant: number | string,
  pourcentage: number | string
): number {
  const m = new Decimal(montant)
  const p = new Decimal(pourcentage).dividedBy(100)

  return m.times(p).toDecimalPlaces(2).toNumber()
}

/**
 * Compare deux montants (égalité stricte à 2 décimales)
 *
 * @param montant1 - Premier montant
 * @param montant2 - Deuxième montant
 * @returns true si les montants sont égaux à 2 décimales près
 *
 * @example
 * ```typescript
 * areAmountsEqual(10.334, 10.335) // true (tous deux arrondis à 10.33)
 * areAmountsEqual(10.10, 10.1) // true
 * areAmountsEqual(10.11, 10.12) // false
 * ```
 */
export function areAmountsEqual(
  montant1: number | string,
  montant2: number | string
): boolean {
  const m1 = new Decimal(montant1).toDecimalPlaces(2)
  const m2 = new Decimal(montant2).toDecimalPlaces(2)

  return m1.equals(m2)
}
