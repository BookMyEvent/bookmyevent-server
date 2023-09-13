var admin = require("firebase-admin");
require('dotenv').config();

/* console.log(process.env.PRIVATE_KEY);
const firebase = admin.initializeApp({
    credential: admin.credential.cert({
        "type": process.env.TYPE,
        "project_id": process.env.PROJECT_ID,
        "private_key_id": process.env.PRIVATE_KEY_ID,
        "private_key": process.env.PRIVATE_KEY,
        "client_email": process.env.CLIENT_EMAIL,
        "client_id": process.env.CLIENT_ID,
        "auth_uri": process.env.AUTH_URI,
        "token_uri": process.env.TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
        "universal_domain":process.env.UNIVERSAL_DOMAIN
    })
}); */


const firebase = admin.initializeApp({
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": "bookmyevent-2d1e9",
        "private_key_id": "c3183ea996cf2877668ec7d11ea8daa1b1e44011",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCl4kf9RcJs8VP/\nlN5hQQux6moBqzFi0SmuKNejfzNY+9KhLsVzj3TPV8gsA7fa5wvguZAEdTRTWDPf\nDPiunUfH0V/ob720hXQ0gYog1i5N0EGsa9LMEypR+UqMM4xzwADe5Yt7p09fP3cZ\nXYCrCN7Er94lIcruYRdZJ1atDOPHclEIo3emj+sc9kcvx1pcn/7Dg6qNq5SbBNYP\n6keYXquIRVEnf+Ngb2tmAA2Os/SO9lrlsd5NgGqQ+8cX51nJ1eIhzlLR8QzbDrOd\n+JYSHAaBMyGMf+YlX0GXiZEtPTSFgQPk0Onqur22vvL5EGms9xwGumAmDzYZLYac\nYK/iwhudAgMBAAECggEACVurG6wq9udkXuJAlgmhMG/HfCxICcmVSYhvUH9qtPs7\n24ZJHab6/Cl5FuvncYIgRuoLqFy4+iIF3HBIZTK6lm4G3uooMGi+Rf9a0gBoi1Do\n1jfHpBCeuLzQtPkW1CmBmGbTCBjyXtlfOCnwtMq4JS4WC6U3jrF2gOaPEA3OmcqP\nUeJM9bEwhjU56UgFh9Z+6lS4PR76scWyxFvdRQ6rPJPRNlk4wOUygrpLd6l/GIzm\nLipAi/uW+y3aHiQE4SBR7KUACS+7CVpLphyy0RbFba9YhQwyYRdvfs+zz5Mqf3rO\n3WdI8p1ygpidSjwlaXKokNHI0EvM7VwNGhWKjXLyIQKBgQDif5J+ldarw+7kkzY0\nVVxEr4bIfzRd/eNv1iRxNBA+fAWnbLZj6YeO0ff5tW9kNNzTQRoXIwoWl+TyxHTR\nfEmJjkXAfMIn09sIRcjyyqHWMHKPwZjfOAJcWeIw9LyDHau4UPIdA4TZCAN1KOOQ\nQhFBpObLJopc4FoEQq9sx7ChbQKBgQC7fZBR9hbzqV350xOo+aIwuZ4NDi9mG6qf\nhQeti1oG2jS21u1V0ZfktTZIf7SdUfDnQB2V30pTvDDPLfF5oANwaNzH3fzCZri3\n1mnmBTTXaVZZbN46ENDwfLVO5BYlswg42yURh3Sv85u0o+8QQy69t6arUrqHyDSL\nE7mM2XA08QKBgAOuQQovkyp9Z59tSP82t+Yh2BXgA1DXtF934mW4i98IEutyl9At\n1lca0GXNbf754PDJ6QuhNSPC2iSbzq4sz+EdX8LOBDWzeqa6w5Y2dsTNSr9NTRer\niFZJ26QiBgI3dDftkNGp4fnI6I152aDZggBIFrwMZ0k1GCFjmAgzgopNAoGBAI9w\neehqqJaT3eTSmrjs+yvh5kxArPymb/wIz53y/dY+PJQhjIPajSWZicUfhrPRS8fv\n4nKV2QyE7qailJqjU949K6Pxbn3gDrP+4xfqpcmjuj9CLiYoVWGXVzLbByKifMja\nx9pIUnqGmnox7ST48RqOFYH/EdvtzF0Wox9h/xlRAoGAZr2jXqFrxxrQPkuJki3Z\nbRI2dvhL/qV7C1xEAud2GapLQiS9nSAkSGriqFSyJOf8TmHLew388ZsEQ18yxo/D\nY1fz+BBqsQHqxBxtop5CRxgHqe8br5BmccKgihjgik4LFw9OlQHi9bB3hA8iJ876\nqcqzHdxHhwRLR6MAzlMC66s=\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-cin0w@bookmyevent-2d1e9.iam.gserviceaccount.com",
        "client_id": "112013263799599643216",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-cin0w%40bookmyevent-2d1e9.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    })
});


module.exports = firebase