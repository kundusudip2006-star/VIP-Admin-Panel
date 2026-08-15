// ==========================
// Firebase Config
// ==========================

const firebaseConfig = {

    apiKey: "AIzaSyCzafp4UUiP2Md6OOThJKNpcKPNR18pW70",

    authDomain:
        "vip-admin-panel-2fc30.firebaseapp.com",

    projectId:
        "vip-admin-panel-2fc30",

    storageBucket:
        "vip-admin-panel-2fc30.firebasestorage.app",

    messagingSenderId:
        "971077853792",

    appId:
        "1:971077853792:web:f17aa5ea34814ff9539905",

    measurementId:
        "G-85JLKE8LCJ"
};


// ==========================
// Initialize Firebase
// ==========================

if (!firebase.apps.length) {

    firebase.initializeApp(firebaseConfig);

}


// ==========================
// Firebase Services
// ==========================

const auth = firebase.auth();

const db = firebase.firestore();