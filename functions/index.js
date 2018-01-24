'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')({origin: true});
const app = express();

/**
 * Server set up validation filter and routes
 */

const validateFirebaseIdToken = (req, res, next) => {
    console.log('Check if request is authorized with Firebase ID token');
  
    if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))) {
      console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
          'Make sure you authorize your request by providing the following HTTP header:',
          'Authorization: Bearer <Firebase ID Token>');
      res.status(403).send('Unauthorized');
      return;
    }
  
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      console.log('Found "Authorization" header');
      // Read the ID Token from the Authorization header.
      idToken = req.headers.authorization.split('Bearer ')[1];
    }
    
    admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
      console.log('ID Token correctly decoded', decodedIdToken);
      req.user = decodedIdToken;
      next();
    }).catch(error => {
      console.error('Error while verifying Firebase ID token:', error);
      res.status(403).send('Unauthorized');
    });
};

app.use(cors);
app.use(validateFirebaseIdToken);
app.use(bodyParser.json());

// just to test if the token is resolved
app.get('/hello', (req, res) => {
  res.send(`Hello ${req.user.name}`);
});

//get game
app.get('/games/:id', (req, res) => {
    getGame(req.user, req.params.id).then( snapshot => {
        const game = snapshot.val();
        //just for the print and debugging purposes
        game.id = req.params.id;
        res.send(printGame(game));
    });
});

//new game
app.post('/games', (req, res) => {    
    const game = {};
    
    game.height = parseInt(req.body.height);
    game.width = parseInt(req.body.width);
    game.mines = parseInt(req.body.mines);
    
    game.board = generateBoard(game.height, game.width, game.mines);

    game.id = saveGame(req.user, game);

    res.send(printGame(game));
});

exports.app = functions.https.onRequest(app);

/**
 * Game Logic
 */

const generateBoard = (height, width, mines) => {
    const board = [];
    for(let y=0; y<height; y++){
        board[y] = [];
        for(let x=0; x<width; x++){
            board[y].push(generateEmptyCell(x,y));  
        }
    }

    generateMines(board, mines);

    return board;
};

const generateMines = (board, mines) => {
    const tempBoard = [].concat(...board);
    
    for(let m=0; m<mines; m++){
        const pos = getRandom(tempBoard.length);
        const ry = tempBoard[pos].y;
        const rx = tempBoard[pos].x;

        const cell = board[ry][rx];
        cell.hasMine = true;
        //remove the cell to avoid infinite iterations
        tempBoard.splice(pos, 1);
    }

}

const generateEmptyCell = (x,y) => {
    return {
        x: x,
        y: y,
        hasMine: false,
        hasQuestionMark: false,
        hasFlag: false,
        isOpen: false,
        number:0    
    }   
}

const getRandom = (max) => {
    return Math.floor(Math.random() * Math.floor(max)); 
};

const printGame = (game) => {
    let strBoard = '<html><body>';

    strBoard += `GameId : ${game.id} <br>`;

    for(let y=0; y<game.height; y++){
        for(let x=0; x<game.width; x++){
            let cell = game.board[y][x];
            if(cell.hasMine){
                strBoard += '*';    
            } else if (cell.hasFlag){
                strBoard += 'F';
            } else if (cell.hasQuestionMark){
                strBoard += '?';
            } else if (cell.isOpen){
                strBoard += cell.number;
            } else if (!cell.isOpen){
                strBoard += 'C';
            } 
        }
        strBoard += '<br>';
    }

    strBoard += '</body></html>'
    return strBoard;
}

/**
 * Saves the new game and returns the generated game id
 * @param {*} user 
 * @param {*} game
 */
const saveGame = (user, game) => { return admin.database().ref(`/users/${user.uid}/games`).push(game).key }

/**
 * Get game by id : returns a promise
 * @param {*} user 
 * @param {*} gameId 
 */
const getGame = (user, gameId) => {
    const gameRef = admin.database().ref().child(`/users/${user.uid}/games/${gameId}`);
    return gameRef.once('value');
}


