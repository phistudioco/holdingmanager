/**
 * Service Worker pour HoldingManager PHI Studios
 * Gère les notifications push navigateur
 */

const CACHE_NAME = 'holdingmanager-v1';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installé');
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activé');
  event.waitUntil(clients.claim());
});

// Réception d'une notification push
self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu:', event);

  let data = {
    title: 'HoldingManager',
    body: 'Nouvelle notification',
    icon: '/logo-icon.png',
    badge: '/logo-icon.png',
    tag: 'default',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || payload.id || data.tag,
        data: {
          url: payload.url || payload.lien || '/',
          type: payload.type || 'notification',
          entite_type: payload.entite_type,
          entite_id: payload.entite_id,
          id: payload.id
        }
      };
    } catch (e) {
      console.error('[SW] Erreur parsing données push:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Voir'
      },
      {
        action: 'dismiss',
        title: 'Fermer'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Construire l'URL de destination
  let targetUrl = '/';
  if (event.notification.data) {
    if (event.notification.data.url) {
      targetUrl = event.notification.data.url;
    } else if (event.notification.data.entite_type && event.notification.data.entite_id) {
      const routes = {
        facture: `/finance/factures/${event.notification.data.entite_id}`,
        contrat: `/finance/contrats/${event.notification.data.entite_id}`,
        devis: `/finance/devis/${event.notification.data.entite_id}`,
        workflow_demande: `/workflows/${event.notification.data.entite_id}`,
        client: `/finance/clients/${event.notification.data.entite_id}`,
      };
      targetUrl = routes[event.notification.data.entite_type] || '/alertes';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Chercher une fenêtre déjà ouverte
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Ouvrir une nouvelle fenêtre si aucune n'existe
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Fermeture d'une notification
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée:', event.notification.tag);
});

// Événement de souscription push
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Subscription changée');
  // L'application doit resynchroniser l'abonnement
});
