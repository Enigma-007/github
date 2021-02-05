navigator.serviceWorker.register('/service_worker.js');

/**
 * urlBase64ToUint8Array
 *
 * @param {string} base64String a public vapid key
 */
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

navigator.serviceWorker.ready
    .then(function (registration) {
        console.log(registration);

        return registration.pushManager.getSubscription()
            .then(async function (subscription) {
                if (subscription) {
                    console.log('got subscription!', subscription)
                    return subscription;
                }
                const response = await fetch('/api/vapid-public-key');
                console.log(response);
                const jsonResponse = JSON.parse(await response.text());
                const vapidPublicKey = jsonResponse.vapid_public_key;
                console.log('decoding:', vapidPublicKey);
                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
                console.log('got vapidPublicKey', vapidPublicKey, convertedVapidKey)

                return registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            });

    }).then(function (subscription) {
        console.log('register!', subscription)
        fetch('/api/web-push-register', {
            method: 'post',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                subscription: subscription
            }),
        }).then(() => {
            window.close();
        });
    });
