-- ============================================================
-- MIGRATION: Notifications pour Demandes Clients
-- ============================================================

-- ============================================================
-- Fonction pour créer une notification de nouvelle demande
-- ============================================================

CREATE OR REPLACE FUNCTION notify_nouvelle_demande()
RETURNS TRIGGER AS $$
DECLARE
    client_nom TEXT;
    service_label TEXT;
BEGIN
    -- Récupérer le nom du client
    SELECT nom INTO client_nom FROM clients WHERE id = NEW.client_id;

    -- Définir le label du service
    service_label := CASE NEW.service_type
        WHEN 'robotique' THEN 'Robotique'
        WHEN 'digital' THEN 'Digital'
        WHEN 'outsourcing' THEN 'Outsourcing'
        ELSE NEW.service_type
    END;

    -- Créer une notification pour les responsables
    INSERT INTO notifications (
        user_id,
        titre,
        message,
        type,
        severite,
        lien,
        created_at
    )
    SELECT
        u.id,
        'Nouvelle demande client',
        'Le client ' || COALESCE(client_nom, 'Inconnu') || ' a soumis une demande ' || service_label || ' : ' || NEW.titre,
        'demande_client',
        CASE NEW.urgence
            WHEN 'urgente' THEN 'critique'
            WHEN 'haute' THEN 'haute'
            ELSE 'moyenne'
        END,
        '/demandes/' || NEW.id,
        NOW()
    FROM users u
    WHERE u.role IN ('admin', 'super_admin', 'directeur', 'responsable', 'manager');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour nouvelles demandes
DROP TRIGGER IF EXISTS trigger_notify_nouvelle_demande ON demandes_clients;
CREATE TRIGGER trigger_notify_nouvelle_demande
    AFTER INSERT ON demandes_clients
    FOR EACH ROW
    EXECUTE FUNCTION notify_nouvelle_demande();

-- ============================================================
-- Fonction pour notifier l'assignation
-- ============================================================

CREATE OR REPLACE FUNCTION notify_demande_assignation()
RETURNS TRIGGER AS $$
DECLARE
    employe_email TEXT;
    employe_user_id UUID;
    client_nom TEXT;
BEGIN
    -- Seulement si assignee_id a changé et n'est pas null
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id AND NEW.assignee_id IS NOT NULL THEN
        -- Récupérer l'email de l'employé assigné
        SELECT email INTO employe_email FROM employes WHERE id = NEW.assignee_id;

        -- Trouver le user_id correspondant
        SELECT id INTO employe_user_id FROM users WHERE email = employe_email;

        -- Récupérer le nom du client
        SELECT nom INTO client_nom FROM clients WHERE id = NEW.client_id;

        IF employe_user_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                titre,
                message,
                type,
                severite,
                lien,
                created_at
            ) VALUES (
                employe_user_id,
                'Demande assignée',
                'La demande ' || NEW.numero || ' du client ' || COALESCE(client_nom, 'Inconnu') || ' vous a été assignée : ' || NEW.titre,
                'demande_client',
                CASE NEW.urgence
                    WHEN 'urgente' THEN 'critique'
                    WHEN 'haute' THEN 'haute'
                    ELSE 'moyenne'
                END,
                '/demandes/' || NEW.id,
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour assignation
DROP TRIGGER IF EXISTS trigger_notify_demande_assignation ON demandes_clients;
CREATE TRIGGER trigger_notify_demande_assignation
    AFTER UPDATE ON demandes_clients
    FOR EACH ROW
    EXECUTE FUNCTION notify_demande_assignation();

-- ============================================================
-- Fonction pour notifier le client d'un changement de statut
-- ============================================================

CREATE OR REPLACE FUNCTION notify_client_statut_change()
RETURNS TRIGGER AS $$
DECLARE
    client_user_id UUID;
    statut_label TEXT;
BEGIN
    -- Seulement si le statut a changé
    IF OLD.statut IS DISTINCT FROM NEW.statut THEN
        -- Récupérer le user_id du client (portail)
        SELECT portail_user_id INTO client_user_id FROM clients WHERE id = NEW.client_id;

        -- Définir le label du statut
        statut_label := CASE NEW.statut
            WHEN 'nouvelle' THEN 'Nouvelle'
            WHEN 'en_cours' THEN 'En cours de traitement'
            WHEN 'en_attente' THEN 'En attente'
            WHEN 'terminee' THEN 'Terminée'
            WHEN 'annulee' THEN 'Annulée'
            ELSE NEW.statut
        END;

        IF client_user_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                titre,
                message,
                type,
                severite,
                lien,
                created_at
            ) VALUES (
                client_user_id,
                'Mise à jour de votre demande',
                'Votre demande ' || NEW.numero || ' est maintenant : ' || statut_label,
                'demande_client',
                'moyenne',
                '/portail/demandes/' || NEW.id,
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour changement de statut (notification client)
DROP TRIGGER IF EXISTS trigger_notify_client_statut ON demandes_clients;
CREATE TRIGGER trigger_notify_client_statut
    AFTER UPDATE ON demandes_clients
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_statut_change();

-- ============================================================
-- Fonction pour notifier d'un nouveau message
-- ============================================================

CREATE OR REPLACE FUNCTION notify_nouveau_message()
RETURNS TRIGGER AS $$
DECLARE
    demande_record RECORD;
    target_user_id UUID;
BEGIN
    -- Récupérer les infos de la demande
    SELECT
        dc.numero,
        dc.titre,
        dc.client_id,
        dc.assignee_id,
        c.portail_user_id,
        e.email as assignee_email
    INTO demande_record
    FROM demandes_clients dc
    LEFT JOIN clients c ON c.id = dc.client_id
    LEFT JOIN employes e ON e.id = dc.assignee_id
    WHERE dc.id = NEW.demande_id;

    -- Si c'est un message du client, notifier l'employé assigné
    IF NEW.auteur_type = 'client' AND NOT NEW.est_interne THEN
        IF demande_record.assignee_email IS NOT NULL THEN
            SELECT id INTO target_user_id FROM users WHERE email = demande_record.assignee_email;

            IF target_user_id IS NOT NULL THEN
                INSERT INTO notifications (
                    user_id,
                    titre,
                    message,
                    type,
                    severite,
                    lien,
                    created_at
                ) VALUES (
                    target_user_id,
                    'Nouveau message client',
                    'Nouveau message sur la demande ' || demande_record.numero || ' : ' || LEFT(NEW.message, 100),
                    'demande_client',
                    'moyenne',
                    '/demandes/' || NEW.demande_id,
                    NOW()
                );
            END IF;
        END IF;
    -- Si c'est un message de l'employé (non interne), notifier le client
    ELSIF NEW.auteur_type = 'employe' AND NOT NEW.est_interne THEN
        IF demande_record.portail_user_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                titre,
                message,
                type,
                severite,
                lien,
                created_at
            ) VALUES (
                demande_record.portail_user_id,
                'Réponse à votre demande',
                'Nouvelle réponse sur votre demande ' || demande_record.numero,
                'demande_client',
                'moyenne',
                '/portail/demandes/' || NEW.demande_id,
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour nouveaux messages
DROP TRIGGER IF EXISTS trigger_notify_nouveau_message ON demandes_messages;
CREATE TRIGGER trigger_notify_nouveau_message
    AFTER INSERT ON demandes_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_nouveau_message();

-- ============================================================
-- Commentaires
-- ============================================================

COMMENT ON FUNCTION notify_nouvelle_demande IS 'Notifie les responsables lors de la création d''une nouvelle demande client';
COMMENT ON FUNCTION notify_demande_assignation IS 'Notifie l''employé lorsqu''une demande lui est assignée';
COMMENT ON FUNCTION notify_client_statut_change IS 'Notifie le client lorsque le statut de sa demande change';
COMMENT ON FUNCTION notify_nouveau_message IS 'Notifie du nouveau message sur une demande';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
