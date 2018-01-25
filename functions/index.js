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

// just to test if the token was correctly resolved
app.get('/hello', (req, res) => {
  res.send(`Hello ${req.user.name}`);
});

//get game
app.get('/games/:id', (req, res) => {
    getGame(req.user, req.params.id).then( snapshot => {
        const game = snapshot.val();
        game.id = req.params.id;
        
        res.send(game);
    });
});

//get game in html format just for testing purposses
app.get('/games/:id/readable', (req, res) => {
    getGame(req.user, req.params.id).then( snapshot => {
        const game = snapshot.val();
        game.id = req.params.id;
        
        res.send(printGame(game));
    });
});

//new game
app.post('/games', (req, res) => {    
    const game = {};
    
    game.status = 'OK';
    game.height = parseInt(req.body.height);
    game.width = parseInt(req.body.width);
    game.mines = parseInt(req.body.mines);
    //firebase db doesn't support dates
    game.startDate = new Date().getTime();
    game.openCells = 0;
    
    game.board = generateBoard(game.height, game.width, game.mines);

    game.id = saveGame(req.user, game);

    res.send(game);
});

//open cell
app.patch('/games/:id/cells', (req, res) => {    
    const x = parseInt(req.body.x);
    const y = parseInt(req.body.y);
    
    getGame(req.user, req.params.id).then( snapshot => {
        const game = snapshot.val();
        game.id = req.params.id;

        game.status = openCell(game, x, y);
        
        updateGame(req.user, game);
        
        res.send(game);
    });
});

//set flag
app.patch('/games/:id/flags', (req, res) => {    
    const x = parseInt(req.body.x);
    const y = parseInt(req.body.y);
    
    getGame(req.user, req.params.id).then( snapshot => {
        const game = snapshot.val();
        game.id = req.params.id;
        
        setFlag(game, x, y);
        
        updateGame(req.user, game);
        
        res.send(game);
    });
});

//set flag
app.patch('/games/:id/marks', (req, res) => {    
    const x = parseInt(req.body.x);
    const y = parseInt(req.body.y);
    
    getGame(req.user, req.params.id).then( snapshot => {
        const game = snapshot.val();
        game.id = req.params.id;
        
        setMark(game, x, y);
        
        updateGame(req.user, game);
        
        res.send(game);
    });
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

const getRandom = (max) => Math.floor(Math.random() * Math.floor(max));

const printGame = (game) => {
    const duration = (new Date().getTime() - parseFloat(game.startDate)) / 60000;

    let strBoard = '<html><body>';

    strBoard += `GameId : ${game.id}<br>`;
    strBoard += `Status : ${game.status}<br>`;
    strBoard += `Timer  : ${duration.toFixed(2)} mins<br>`;

    for(let y=0; y<game.height; y++){
        for(let x=0; x<game.width; x++){
            let cell = game.board[y][x];
            
            if (cell.hasFlag){
                strBoard += 'F';
            } else if (cell.hasQuestionMark){
                strBoard += '?';
            } else if(cell.hasMine){
                strBoard += '*';    
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

const getNeighbours = (game, cell) => {
    const neighbours = [];

    const maxY = game.height;
    const maxX = game.width;
    const board = game.board;

    //left
    if (cell.x - 1 >= 0) neighbours.push(board[cell.y][cell.x-1]);
    //right
    if (cell.x + 1 < maxX) neighbours.push(board[cell.y][cell.x+1]);
    //up
    if (cell.y - 1 >= 0) neighbours.push(board[cell.y-1][cell.x]);
    //down
    if (cell.y + 1 < maxY) neighbours.push(board[cell.y+1][cell.x]);
    //up-left
    if ( (cell.y - 1 >= 0) && (cell.x - 1 >= 0)) neighbours.push(board[cell.y-1][cell.x-1]);
    //up-right
    if ( (cell.y - 1 >= 0) && (cell.x + 1 < maxX)) neighbours.push(board[cell.y-1][cell.x+1]);
    //down-left
    if ( (cell.y + 1 < maxY) && (cell.x - 1 >= 0)) neighbours.push(board[cell.y+1][cell.x-1]);
    //down-right
    if ( (cell.y + 1 < maxY) && (cell.x + 1 < maxX)) neighbours.push(board[cell.y+1][cell.x+1]);
    
    return neighbours;
};

const freeArea = (game, cell) => {
    cell.isOpen = true;
    game.openCells++;    

    const area = getNeighbours(game, cell);
    
    //calculate cell number
    const contextMines = area.filter(n => n.hasMine).length;
    
    if(contextMines > 0){
        //set number of near mines and stop
        cell.number = contextMines;
        return; 
    } else {
        //extend on neighbours that doesn't have mines or flags or question marks or were previously opened
        const unknownNeighbours = area.filter(n => !n.hasMine && !n.hasFlag && !n.hasQuestionMark && !n.isOpen);
        
        if(unknownNeighbours.length > 0){
            //recursive neighbour checking
            unknownNeighbours.forEach(neighbourCell => freeArea(game, neighbourCell));
        } else {
            //no more neighbours so stop
            return;
        }
    }
};

//the game ends when you opened all the cells that doesn't contain a mine
const isGameFinished = (game) => (game.height * game.width) - game.openCells === game.mines;

/**
 * Attempts to open a cell at x,y coordinates, it returns status 'OK' if it's not a mine and 'BOOM' if it's a mine
 * @param {*} x 
 * @param {*} y
 */
const openCell = (game, x, y) => {
    const cell = game.board[y][x];
    //won't do anything if the cell is already open
    if (cell.isOpen) { return 'OK' };

    if(cell.hasMine){
        return 'BOOM';
    }else {
        freeArea(game, cell);
        return (isGameFinished(game)) ? 'GAME OVER' : 'OK';             
    }
};

/**
 * Updates the question mark switch (on/off) on a cell at the specified coordinates and returns the updated json data about the game.
 * It overrides any other tag on the cell.
 * @param {*} x 
 * @param {*} y
 */
const setMark = (game, x, y) => {
    const cell = game.board[y][x];
    
    if(!cell.isOpen){
        cell.hasFlag = false;
        cell.hasQuestionMark = !cell.hasQuestionMark; 
    }    
};

/**
 * Updates the flag switch (on/off) on a cell at the specified coordinates and returns the updated json data about the game.
 * It overrides any other tag on the cell.
 * @param {*} x 
 * @param {*} y
 */
const setFlag = (game, x, y) => {
    const cell = game.board[y][x];
    
    if(!cell.isOpen){
        cell.hasQuestionMark = false;
        cell.hasFlag = !cell.hasFlag; 
    }    
};

/**
 * Saves the new game and returns the generated game id
 * @param {*} user 
 * @param {*} game
 */
const saveGame = (user, game) => admin.database().ref(`/users/${user.uid}/games`).push(game).key;

/**
 * Get game by id : returns a promise
 * @param {*} user 
 * @param {*} gameId 
 */
const getGame = (user, gameId) => admin.database().ref().child(`/users/${user.uid}/games/${gameId}`).once('value');

/**
 * Updates the game
 * @param {*} user 
 * @param {*} game
 */
const updateGame = (user, game) => admin.database().ref().child(`/users/${user.uid}/games/${game.id}`).update(game);


