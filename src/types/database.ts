/**
 * Types générés pour Supabase
 * Ce fichier sera régénéré par la CLI Supabase : npx supabase gen types typescript
 * Pour l'instant, nous définissons une structure de base
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ============================================================
      // TABLES CORE
      // ============================================================
      users: {
        Row: {
          id: string
          nom: string
          prenom: string
          email: string
          role_id: number
          avatar: string | null
          telephone: string | null
          statut: 'actif' | 'inactif' | 'suspendu'
          derniere_connexion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nom: string
          prenom: string
          email: string
          role_id: number
          avatar?: string | null
          telephone?: string | null
          statut?: 'actif' | 'inactif' | 'suspendu'
          derniere_connexion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nom?: string
          prenom?: string
          email?: string
          role_id?: number
          avatar?: string | null
          telephone?: string | null
          statut?: 'actif' | 'inactif' | 'suspendu'
          derniere_connexion?: string | null
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: number
          nom: string
          description: string | null
          permissions: Json
          niveau: number
          created_at: string
        }
        Insert: {
          id?: number
          nom: string
          description?: string | null
          permissions?: Json
          niveau?: number
          created_at?: string
        }
        Update: {
          nom?: string
          description?: string | null
          permissions?: Json
          niveau?: number
        }
      }
      filiales: {
        Row: {
          id: number
          code: string
          nom: string
          adresse: string | null
          ville: string | null
          code_postal: string | null
          pays_id: number | null
          telephone: string | null
          email: string | null
          site_web: string | null
          directeur_nom: string | null
          directeur_email: string | null
          statut: 'actif' | 'inactif' | 'en_creation'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          code: string
          nom: string
          adresse?: string | null
          ville?: string | null
          code_postal?: string | null
          pays_id?: number | null
          telephone?: string | null
          email?: string | null
          site_web?: string | null
          directeur_nom?: string | null
          directeur_email?: string | null
          statut?: 'actif' | 'inactif' | 'en_creation'
          created_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          nom?: string
          adresse?: string | null
          ville?: string | null
          code_postal?: string | null
          pays_id?: number | null
          telephone?: string | null
          email?: string | null
          site_web?: string | null
          directeur_nom?: string | null
          directeur_email?: string | null
          statut?: 'actif' | 'inactif' | 'en_creation'
          updated_at?: string
        }
      }
      employes: {
        Row: {
          id: number
          filiale_id: number
          service_id: number | null
          matricule: string
          nom: string
          prenom: string
          email: string | null
          telephone: string | null
          date_naissance: string | null
          adresse: string | null
          poste: string | null
          date_embauche: string
          date_depart: string | null
          salaire: number | null
          photo: string | null
          statut: 'actif' | 'en_conge' | 'suspendu' | 'sorti'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filiale_id: number
          service_id?: number | null
          matricule: string
          nom: string
          prenom: string
          email?: string | null
          telephone?: string | null
          date_naissance?: string | null
          adresse?: string | null
          poste?: string | null
          date_embauche: string
          date_depart?: string | null
          salaire?: number | null
          photo?: string | null
          statut?: 'actif' | 'en_conge' | 'suspendu' | 'sorti'
          created_at?: string
          updated_at?: string
        }
        Update: {
          filiale_id?: number
          service_id?: number | null
          matricule?: string
          nom?: string
          prenom?: string
          email?: string | null
          telephone?: string | null
          date_naissance?: string | null
          adresse?: string | null
          poste?: string | null
          date_embauche?: string
          date_depart?: string | null
          salaire?: number | null
          photo?: string | null
          statut?: 'actif' | 'en_conge' | 'suspendu' | 'sorti'
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: number
          nom: string
          description: string | null
          couleur: string
          icone: string | null
          created_at: string
        }
        Insert: {
          id?: number
          nom: string
          description?: string | null
          couleur: string
          icone?: string | null
          created_at?: string
        }
        Update: {
          nom?: string
          description?: string | null
          couleur?: string
          icone?: string | null
        }
      }
      pays: {
        Row: {
          id: number
          code: string
          nom: string
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          nom: string
          created_at?: string
        }
        Update: {
          code?: string
          nom?: string
        }
      }

      // ============================================================
      // TABLES FINANCE
      // ============================================================
      clients: {
        Row: {
          id: number
          filiale_id: number
          type: 'entreprise' | 'particulier'
          code: string
          nom: string
          email: string | null
          telephone: string | null
          adresse: string | null
          ville: string | null
          code_postal: string | null
          pays_id: number | null
          siret: string | null
          tva_intracommunautaire: string | null
          forme_juridique: string | null
          delai_paiement: number
          mode_reglement_prefere: string | null
          limite_credit: number | null
          statut: 'prospect' | 'actif' | 'inactif' | 'suspendu'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filiale_id: number
          type: 'entreprise' | 'particulier'
          code: string
          nom: string
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          ville?: string | null
          code_postal?: string | null
          pays_id?: number | null
          siret?: string | null
          tva_intracommunautaire?: string | null
          forme_juridique?: string | null
          delai_paiement?: number
          mode_reglement_prefere?: string | null
          limite_credit?: number | null
          statut?: 'prospect' | 'actif' | 'inactif' | 'suspendu'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          filiale_id?: number
          type?: 'entreprise' | 'particulier'
          code?: string
          nom?: string
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          ville?: string | null
          code_postal?: string | null
          pays_id?: number | null
          siret?: string | null
          tva_intracommunautaire?: string | null
          forme_juridique?: string | null
          delai_paiement?: number
          mode_reglement_prefere?: string | null
          limite_credit?: number | null
          statut?: 'prospect' | 'actif' | 'inactif' | 'suspendu'
          notes?: string | null
          updated_at?: string
        }
      }
      factures: {
        Row: {
          id: number
          filiale_id: number
          client_id: number
          contrat_id: number | null
          numero: string
          type: 'facture' | 'avoir' | 'acompte' | 'proforma'
          date_emission: string
          date_echeance: string
          objet: string | null
          total_ht: number
          taux_tva: number
          total_tva: number
          total_ttc: number
          montant_paye: number
          statut: 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'annulee'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filiale_id: number
          client_id: number
          contrat_id?: number | null
          numero: string
          type?: 'facture' | 'avoir' | 'acompte' | 'proforma'
          date_emission: string
          date_echeance: string
          objet?: string | null
          total_ht?: number
          taux_tva?: number
          total_tva?: number
          total_ttc?: number
          montant_paye?: number
          statut?: 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'annulee'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          filiale_id?: number
          client_id?: number
          contrat_id?: number | null
          numero?: string
          type?: 'facture' | 'avoir' | 'acompte' | 'proforma'
          date_emission?: string
          date_echeance?: string
          objet?: string | null
          total_ht?: number
          taux_tva?: number
          total_tva?: number
          total_ttc?: number
          montant_paye?: number
          statut?: 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'annulee'
          notes?: string | null
          updated_at?: string
        }
      }
      facture_lignes: {
        Row: {
          id: number
          facture_id: number
          description: string
          quantite: number
          prix_unitaire: number
          taux_tva: number
          montant_ht: number
          montant_tva: number
          montant_ttc: number
          ordre: number
          created_at: string
        }
        Insert: {
          id?: number
          facture_id: number
          description: string
          quantite?: number
          prix_unitaire: number
          taux_tva?: number
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          ordre?: number
          created_at?: string
        }
        Update: {
          facture_id?: number
          description?: string
          quantite?: number
          prix_unitaire?: number
          taux_tva?: number
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          ordre?: number
        }
      }
      devis: {
        Row: {
          id: number
          filiale_id: number
          client_id: number
          numero: string
          date_emission: string
          date_validite: string
          objet: string | null
          total_ht: number
          taux_tva: number
          total_tva: number
          total_ttc: number
          statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'converti'
          facture_id: number | null
          notes: string | null
          conditions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filiale_id: number
          client_id: number
          numero: string
          date_emission: string
          date_validite: string
          objet?: string | null
          total_ht?: number
          taux_tva?: number
          total_tva?: number
          total_ttc?: number
          statut?: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'converti'
          facture_id?: number | null
          notes?: string | null
          conditions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          filiale_id?: number
          client_id?: number
          numero?: string
          date_emission?: string
          date_validite?: string
          objet?: string | null
          total_ht?: number
          taux_tva?: number
          total_tva?: number
          total_ttc?: number
          statut?: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'converti'
          facture_id?: number | null
          notes?: string | null
          conditions?: string | null
          updated_at?: string
        }
      }
      devis_lignes: {
        Row: {
          id: number
          devis_id: number
          description: string
          quantite: number
          prix_unitaire: number
          taux_tva: number
          montant_ht: number
          montant_tva: number
          montant_ttc: number
          ordre: number
          created_at: string
        }
        Insert: {
          id?: number
          devis_id: number
          description: string
          quantite?: number
          prix_unitaire: number
          taux_tva?: number
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          ordre?: number
          created_at?: string
        }
        Update: {
          devis_id?: number
          description?: string
          quantite?: number
          prix_unitaire?: number
          taux_tva?: number
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          ordre?: number
        }
      }
      contrats: {
        Row: {
          id: number
          filiale_id: number
          client_id: number
          numero: string
          titre: string
          type: 'service' | 'maintenance' | 'licence' | 'location' | 'autre'
          date_debut: string
          date_fin: string | null
          montant: number
          periodicite: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel' | 'ponctuel'
          reconduction_auto: boolean
          statut: 'brouillon' | 'actif' | 'suspendu' | 'termine' | 'resilie'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filiale_id: number
          client_id: number
          numero: string
          titre: string
          type?: 'service' | 'maintenance' | 'licence' | 'location' | 'autre'
          date_debut: string
          date_fin?: string | null
          montant: number
          periodicite?: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel' | 'ponctuel'
          reconduction_auto?: boolean
          statut?: 'brouillon' | 'actif' | 'suspendu' | 'termine' | 'resilie'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          filiale_id?: number
          client_id?: number
          numero?: string
          titre?: string
          type?: 'service' | 'maintenance' | 'licence' | 'location' | 'autre'
          date_debut?: string
          date_fin?: string | null
          montant?: number
          periodicite?: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel' | 'ponctuel'
          reconduction_auto?: boolean
          statut?: 'brouillon' | 'actif' | 'suspendu' | 'termine' | 'resilie'
          description?: string | null
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: number
          filiale_id: number
          type: 'revenu' | 'depense'
          categorie: string
          montant: number
          date_transaction: string
          description: string | null
          reference: string | null
          client_id: number | null
          facture_id: number | null
          statut: 'en_attente' | 'validee' | 'annulee'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filiale_id: number
          type: 'revenu' | 'depense'
          categorie: string
          montant: number
          date_transaction: string
          description?: string | null
          reference?: string | null
          client_id?: number | null
          facture_id?: number | null
          statut?: 'en_attente' | 'validee' | 'annulee'
          created_at?: string
          updated_at?: string
        }
        Update: {
          filiale_id?: number
          type?: 'revenu' | 'depense'
          categorie?: string
          montant?: number
          date_transaction?: string
          description?: string | null
          reference?: string | null
          client_id?: number | null
          facture_id?: number | null
          statut?: 'en_attente' | 'validee' | 'annulee'
          updated_at?: string
        }
      }

      // ============================================================
      // TABLES SERVICES
      // ============================================================
      projets_robotique: {
        Row: {
          id: number
          filiale_id: number
          client_id: number | null
          nom: string
          description: string | null
          statut: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
          date_debut: string | null
          date_fin_prevue: string | null
          budget: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filiale_id: number
          client_id?: number | null
          nom: string
          description?: string | null
          statut?: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
          date_debut?: string | null
          date_fin_prevue?: string | null
          budget?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          filiale_id?: number
          client_id?: number | null
          nom?: string
          description?: string | null
          statut?: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
          date_debut?: string | null
          date_fin_prevue?: string | null
          budget?: number | null
          updated_at?: string
        }
      }
      projets_digital: {
        Row: {
          id: number
          filiale_id: number
          client_id: number | null
          nom: string
          description: string | null
          type: 'site_web' | 'application' | 'ecommerce' | 'mobile' | 'autre'
          statut: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
          url: string | null
          date_debut: string | null
          date_fin_prevue: string | null
          budget: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filiale_id: number
          client_id?: number | null
          nom: string
          description?: string | null
          type?: 'site_web' | 'application' | 'ecommerce' | 'mobile' | 'autre'
          statut?: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
          url?: string | null
          date_debut?: string | null
          date_fin_prevue?: string | null
          budget?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          filiale_id?: number
          client_id?: number | null
          nom?: string
          description?: string | null
          type?: 'site_web' | 'application' | 'ecommerce' | 'mobile' | 'autre'
          statut?: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
          url?: string | null
          date_debut?: string | null
          date_fin_prevue?: string | null
          budget?: number | null
          updated_at?: string
        }
      }
      fournisseurs: {
        Row: {
          id: number
          nom: string
          type: 'materiel' | 'service' | 'logistique' | 'autre'
          contact_nom: string | null
          contact_email: string | null
          contact_telephone: string | null
          adresse: string | null
          ville: string | null
          code_postal: string | null
          pays: string | null
          statut: 'actif' | 'inactif' | 'en_evaluation'
          note_qualite: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nom: string
          type?: 'materiel' | 'service' | 'logistique' | 'autre'
          contact_nom?: string | null
          contact_email?: string | null
          contact_telephone?: string | null
          adresse?: string | null
          ville?: string | null
          code_postal?: string | null
          pays?: string | null
          statut?: 'actif' | 'inactif' | 'en_evaluation'
          note_qualite?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          nom?: string
          type?: 'materiel' | 'service' | 'logistique' | 'autre'
          contact_nom?: string | null
          contact_email?: string | null
          contact_telephone?: string | null
          adresse?: string | null
          ville?: string | null
          code_postal?: string | null
          pays?: string | null
          statut?: 'actif' | 'inactif' | 'en_evaluation'
          note_qualite?: number | null
          notes?: string | null
          updated_at?: string
        }
      }
      commandes_outsourcing: {
        Row: {
          id: number
          numero: string
          fournisseur_id: number
          filiale_id: number
          montant_total: number
          statut: 'brouillon' | 'envoyee' | 'confirmee' | 'livree' | 'annulee'
          date_commande: string
          date_livraison_prevue: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          numero: string
          fournisseur_id: number
          filiale_id: number
          montant_total?: number
          statut?: 'brouillon' | 'envoyee' | 'confirmee' | 'livree' | 'annulee'
          date_commande?: string
          date_livraison_prevue?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          numero?: string
          fournisseur_id?: number
          filiale_id?: number
          montant_total?: number
          statut?: 'brouillon' | 'envoyee' | 'confirmee' | 'livree' | 'annulee'
          date_commande?: string
          date_livraison_prevue?: string | null
          notes?: string | null
          updated_at?: string
        }
      }

      // ============================================================
      // TABLES WORKFLOWS
      // ============================================================
      workflow_types: {
        Row: {
          id: number
          code: string
          nom: string
          description: string | null
          icone: string | null
          couleur: string
          etapes: Json
          actif: boolean
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          nom: string
          description?: string | null
          icone?: string | null
          couleur?: string
          etapes?: Json
          actif?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          nom?: string
          description?: string | null
          icone?: string | null
          couleur?: string
          etapes?: Json
          actif?: boolean
        }
      }
      workflow_demandes: {
        Row: {
          id: number
          numero: string
          type: 'achat' | 'conge' | 'formation' | 'autre'
          demandeur_id: number
          filiale_id: number
          titre: string
          description: string | null
          donnees: Json
          montant: number | null
          statut: 'brouillon' | 'en_cours' | 'approuve' | 'rejete' | 'annule'
          etape_actuelle: number
          priorite: 'basse' | 'normale' | 'haute' | 'urgente'
          date_demande: string
          date_soumission: string | null
          date_finalisation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          numero: string
          type: 'achat' | 'conge' | 'formation' | 'autre'
          demandeur_id: number
          filiale_id: number
          titre: string
          description?: string | null
          donnees?: Json
          montant?: number | null
          statut?: 'brouillon' | 'en_cours' | 'approuve' | 'rejete' | 'annule'
          etape_actuelle?: number
          priorite?: 'basse' | 'normale' | 'haute' | 'urgente'
          date_demande?: string
          date_soumission?: string | null
          date_finalisation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          numero?: string
          type?: 'achat' | 'conge' | 'formation' | 'autre'
          demandeur_id?: number
          filiale_id?: number
          titre?: string
          description?: string | null
          donnees?: Json
          montant?: number | null
          statut?: 'brouillon' | 'en_cours' | 'approuve' | 'rejete' | 'annule'
          etape_actuelle?: number
          priorite?: 'basse' | 'normale' | 'haute' | 'urgente'
          date_demande?: string
          date_soumission?: string | null
          date_finalisation?: string | null
          updated_at?: string
        }
      }
      workflow_approbations: {
        Row: {
          id: number
          demande_id: number
          etape: number
          approbateur_id: number
          statut: 'en_attente' | 'approuve' | 'rejete'
          commentaire: string | null
          date_decision: string | null
          created_at: string
        }
        Insert: {
          id?: number
          demande_id: number
          etape: number
          approbateur_id: number
          statut?: 'en_attente' | 'approuve' | 'rejete'
          commentaire?: string | null
          date_decision?: string | null
          created_at?: string
        }
        Update: {
          demande_id?: number
          etape?: number
          approbateur_id?: number
          statut?: 'en_attente' | 'approuve' | 'rejete'
          commentaire?: string | null
          date_decision?: string | null
        }
      }

      // ============================================================
      // TABLES ALERTES
      // ============================================================
      alertes: {
        Row: {
          id: number
          type: 'facture_impayee' | 'facture_echeance' | 'contrat_expiration' | 'budget_depasse' | 'workflow' | 'autre'
          severite: 'basse' | 'moyenne' | 'haute' | 'critique'
          titre: string
          message: string
          entite_type: string | null
          entite_id: number | null
          lue: boolean
          traitee: boolean
          date_echeance: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          type: 'facture_impayee' | 'facture_echeance' | 'contrat_expiration' | 'budget_depasse' | 'workflow' | 'autre'
          severite?: 'basse' | 'moyenne' | 'haute' | 'critique'
          titre: string
          message: string
          entite_type?: string | null
          entite_id?: number | null
          lue?: boolean
          traitee?: boolean
          date_echeance?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: 'facture_impayee' | 'facture_echeance' | 'contrat_expiration' | 'budget_depasse' | 'workflow' | 'autre'
          severite?: 'basse' | 'moyenne' | 'haute' | 'critique'
          titre?: string
          message?: string
          entite_type?: string | null
          entite_id?: number | null
          lue?: boolean
          traitee?: boolean
          date_echeance?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          user_id: string
          type: string
          titre: string
          message: string
          lien: string | null
          lue: boolean
          date_lecture: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          type: string
          titre: string
          message: string
          lien?: string | null
          lue?: boolean
          date_lecture?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          type?: string
          titre?: string
          message?: string
          lien?: string | null
          lue?: boolean
          date_lecture?: string | null
        }
      }

      // ============================================================
      // TABLES PORTAIL CLIENT
      // ============================================================
      demandes_clients: {
        Row: {
          id: number
          numero: string
          client_id: number
          filiale_id: number | null
          service_type: 'robotique' | 'digital' | 'outsourcing'
          titre: string
          description: string
          urgence: 'basse' | 'normale' | 'haute' | 'urgente'
          date_souhaitee: string | null
          statut: 'nouvelle' | 'en_cours' | 'en_attente' | 'terminee' | 'annulee'
          assignee_id: number | null
          estimation_heures: number | null
          estimation_cout: number | null
          date_debut_prevue: string | null
          date_fin_prevue: string | null
          note_satisfaction: number | null
          commentaire_satisfaction: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          numero?: string
          client_id: number
          filiale_id?: number | null
          service_type: 'robotique' | 'digital' | 'outsourcing'
          titre: string
          description: string
          urgence?: 'basse' | 'normale' | 'haute' | 'urgente'
          date_souhaitee?: string | null
          statut?: 'nouvelle' | 'en_cours' | 'en_attente' | 'terminee' | 'annulee'
          assignee_id?: number | null
          estimation_heures?: number | null
          estimation_cout?: number | null
          date_debut_prevue?: string | null
          date_fin_prevue?: string | null
          note_satisfaction?: number | null
          commentaire_satisfaction?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          numero?: string
          client_id?: number
          filiale_id?: number | null
          service_type?: 'robotique' | 'digital' | 'outsourcing'
          titre?: string
          description?: string
          urgence?: 'basse' | 'normale' | 'haute' | 'urgente'
          date_souhaitee?: string | null
          statut?: 'nouvelle' | 'en_cours' | 'en_attente' | 'terminee' | 'annulee'
          assignee_id?: number | null
          estimation_heures?: number | null
          estimation_cout?: number | null
          date_debut_prevue?: string | null
          date_fin_prevue?: string | null
          note_satisfaction?: number | null
          commentaire_satisfaction?: string | null
          updated_at?: string
        }
      }
      demandes_messages: {
        Row: {
          id: number
          demande_id: number
          auteur_type: 'client' | 'employe'
          auteur_id: number
          message: string
          est_interne: boolean
          created_at: string
        }
        Insert: {
          id?: number
          demande_id: number
          auteur_type: 'client' | 'employe'
          auteur_id: number
          message: string
          est_interne?: boolean
          created_at?: string
        }
        Update: {
          demande_id?: number
          auteur_type?: 'client' | 'employe'
          auteur_id?: number
          message?: string
          est_interne?: boolean
        }
      }
      demandes_fichiers: {
        Row: {
          id: number
          demande_id: number
          message_id: number | null
          nom_fichier: string
          type_fichier: string | null
          taille: number | null
          url_stockage: string
          uploaded_by_type: 'client' | 'employe'
          uploaded_by_id: number
          created_at: string
        }
        Insert: {
          id?: number
          demande_id: number
          message_id?: number | null
          nom_fichier: string
          type_fichier?: string | null
          taille?: number | null
          url_stockage: string
          uploaded_by_type: 'client' | 'employe'
          uploaded_by_id: number
          created_at?: string
        }
        Update: {
          demande_id?: number
          message_id?: number | null
          nom_fichier?: string
          type_fichier?: string | null
          taille?: number | null
          url_stockage?: string
          uploaded_by_type?: 'client' | 'employe'
          uploaded_by_id?: number
        }
      }
      demandes_historique: {
        Row: {
          id: number
          demande_id: number
          action: string
          ancien_valeur: string | null
          nouvelle_valeur: string | null
          description: string | null
          auteur_type: 'client' | 'employe' | 'systeme'
          auteur_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          demande_id: number
          action: string
          ancien_valeur?: string | null
          nouvelle_valeur?: string | null
          description?: string | null
          auteur_type: 'client' | 'employe' | 'systeme'
          auteur_id?: number | null
          created_at?: string
        }
        Update: {
          demande_id?: number
          action?: string
          ancien_valeur?: string | null
          nouvelle_valeur?: string | null
          description?: string | null
          auteur_type?: 'client' | 'employe' | 'systeme'
          auteur_id?: number | null
        }
      }

      // ============================================================
      // TABLES RAPPORTS PERSONNALISÉS
      // ============================================================
      report_templates: {
        Row: {
          id: number
          user_id: string
          nom: string
          description: string | null
          type: 'finance' | 'clients' | 'employes' | 'services' | 'workflows' | 'custom'
          sections: string[]
          filiales_ids: number[]
          periode_type: 'mensuel' | 'trimestriel' | 'annuel' | 'personnalise'
          orientation: 'portrait' | 'paysage'
          inclure_graphiques: boolean
          inclure_logo: boolean
          is_public: boolean
          derniere_generation: string | null
          fois_genere: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          nom: string
          description?: string | null
          type?: 'finance' | 'clients' | 'employes' | 'services' | 'workflows' | 'custom'
          sections?: string[]
          filiales_ids?: number[]
          periode_type?: 'mensuel' | 'trimestriel' | 'annuel' | 'personnalise'
          orientation?: 'portrait' | 'paysage'
          inclure_graphiques?: boolean
          inclure_logo?: boolean
          is_public?: boolean
          derniere_generation?: string | null
          fois_genere?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          nom?: string
          description?: string | null
          type?: 'finance' | 'clients' | 'employes' | 'services' | 'workflows' | 'custom'
          sections?: string[]
          filiales_ids?: number[]
          periode_type?: 'mensuel' | 'trimestriel' | 'annuel' | 'personnalise'
          orientation?: 'portrait' | 'paysage'
          inclure_graphiques?: boolean
          inclure_logo?: boolean
          is_public?: boolean
          derniere_generation?: string | null
          fois_genere?: number
          updated_at?: string
        }
      }

      // ============================================================
      // TABLES NOTIFICATIONS
      // ============================================================
      push_subscriptions: {
        Row: {
          id: number
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
        }
      }
      notification_preferences: {
        Row: {
          id: number
          user_id: string
          email_enabled: boolean
          push_enabled: boolean
          sms_enabled: boolean
          factures_notifications: boolean
          contrats_notifications: boolean
          workflows_notifications: boolean
          alertes_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          email_enabled?: boolean
          push_enabled?: boolean
          sms_enabled?: boolean
          factures_notifications?: boolean
          contrats_notifications?: boolean
          workflows_notifications?: boolean
          alertes_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email_enabled?: boolean
          push_enabled?: boolean
          sms_enabled?: boolean
          factures_notifications?: boolean
          contrats_notifications?: boolean
          workflows_notifications?: boolean
          alertes_notifications?: boolean
          updated_at?: string
        }
      }

      // ============================================================
      // TABLES AFFECTATIONS & BUDGETS
      // ============================================================
      user_affectations: {
        Row: {
          id: number
          user_id: string
          filiale_id: number
          role_filiale: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          filiale_id: number
          role_filiale?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          filiale_id?: number
          role_filiale?: string | null
          is_primary?: boolean
        }
      }
      budgets: {
        Row: {
          id: number
          filiale_id: number
          annee: number
          mois: number | null
          categorie: string
          montant_prevu: number
          montant_utilise: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filiale_id: number
          annee: number
          mois?: number | null
          categorie: string
          montant_prevu: number
          montant_utilise?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          filiale_id?: number
          annee?: number
          mois?: number | null
          categorie?: string
          montant_prevu?: number
          montant_utilise?: number
          notes?: string | null
          updated_at?: string
        }
      }
      paiements: {
        Row: {
          id: number
          facture_id: number
          montant: number
          date_paiement: string
          mode_paiement: 'virement' | 'cheque' | 'especes' | 'carte' | 'prelevement' | 'autre'
          reference: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          facture_id: number
          montant: number
          date_paiement: string
          mode_paiement?: 'virement' | 'cheque' | 'especes' | 'carte' | 'prelevement' | 'autre'
          reference?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          facture_id?: number
          montant?: number
          date_paiement?: string
          mode_paiement?: 'virement' | 'cheque' | 'especes' | 'carte' | 'prelevement' | 'autre'
          reference?: string | null
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      statut_user: 'actif' | 'inactif' | 'suspendu'
      statut_filiale: 'actif' | 'inactif' | 'en_creation'
      statut_employe: 'actif' | 'en_conge' | 'suspendu' | 'sorti'
      statut_client: 'prospect' | 'actif' | 'inactif' | 'suspendu'
      type_client: 'entreprise' | 'particulier'
      statut_facture: 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'annulee'
      type_facture: 'facture' | 'avoir' | 'acompte' | 'proforma'
      statut_devis: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'converti'
      statut_demande: 'brouillon' | 'en_cours' | 'approuve' | 'rejete' | 'annule'
      priorite_demande: 'basse' | 'normale' | 'haute' | 'urgente'
      statut_projet: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
      type_projet_digital: 'site_web' | 'application' | 'ecommerce' | 'mobile' | 'autre'
      type_fournisseur: 'materiel' | 'service' | 'logistique' | 'autre'
      statut_fournisseur: 'actif' | 'inactif' | 'en_evaluation'
      statut_commande: 'brouillon' | 'envoyee' | 'confirmee' | 'livree' | 'annulee'
      // Portail client
      service_type: 'robotique' | 'digital' | 'outsourcing'
      urgence_demande: 'basse' | 'normale' | 'haute' | 'urgente'
      statut_demande_client: 'nouvelle' | 'en_cours' | 'en_attente' | 'terminee' | 'annulee'
      auteur_type: 'client' | 'employe' | 'systeme'
      // Rapports personnalisés
      type_rapport: 'finance' | 'clients' | 'employes' | 'services' | 'workflows' | 'custom'
      periode_type: 'mensuel' | 'trimestriel' | 'annuel' | 'personnalise'
      orientation_rapport: 'portrait' | 'paysage'
      // Paiements
      mode_paiement: 'virement' | 'cheque' | 'especes' | 'carte' | 'prelevement' | 'autre'
    }
  }
}

// Types helpers pour faciliter l'utilisation
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
