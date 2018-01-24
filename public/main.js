'use strict';

const serverUrl = "https://us-central1-minesweeper-8dd52.cloudfunctions.net/helloWorld";

const login = () => { firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()) }

const printCredentials = () => { getToken().then( t => console.log(t)) };

const logout = () => { firebase.auth().signOut() }

const newGame = () => {
    const req = new XMLHttpRequest();

    req.onreadystatechange = function() {
        if (req.readyState == XMLHttpRequest.DONE) {
            console.log(req.responseText)
        }
    }

    getToken().then( token => {
        
        req.open('GET', serverUrl, true)
        req.setRequestHeader('Authorization', 'Bearer ' + token)
        req.send()
    });
}

const getToken = () => { return firebase.auth().currentUser.getIdToken() }