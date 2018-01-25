# minesweeper api

**How to use**
- Log in with a google account using the web client, activate the log in dialog pressing the 'login with google button'
- Print your token in the developer console by pressing the 'show auth token' button
- Use your token to execute the postman requests collection into the /client folder

* **Auth web client url**
https://minesweeper-8dd52.firebaseapp.com
* **Firebase functions base url**
https://us-central1-minesweeper-8dd52.cloudfunctions.net/app

**Show Active Games**
----
  Returns json data with all the active games ids for a specific user.

* **URL**

  /games

* **Method:**

  `GET`

* **Headers**

  Autorization: Bearer [your token]

* **URL Params**

  None

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ games: [...]}`
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "There aren't any active games for this user" }`

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "You are unauthorized to make this request." }`


**Start New Game**
----
  Returns json data with all the active games ids for a specific user.

* **URL**

  /games

* **Method:**

  `POST`

* **Headers**

  Autorization: Bearer [your token]
  Content-Type: application/json

* **URL Params**

  None

* **Data Params**

  {
	  height: [integer],
    width: [integer],
	  mines: [integer]
  }

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ id : 20, board : [[],[], ...] }`
 
* **Error Response:**

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "You are unauthorized to make this request." }`


**Show Game**
----
  Returns json data about a specific game.

* **URL**

  /games/:id

* **Method:**

  `GET`

* **Headers**

  Autorization: Bearer [your token]

* **URL Params**

  **Required:**
 
  `id=[string]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ id : 20, board : [[],[], ...] }`
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "The game doesn't exist" }`

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "You are unauthorized to make this request." }`

**Show Game In Readable Format**
----
  Returns html data about a specific game.

* **URL**

  /games/:id/readable

* **Method:**

  `GET`

* **Headers**

  Autorization: Bearer [your token]

* **URL Params**

  **Required:**
 
  `id=[string]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ id : 20, board : [[],[], ...] }`
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "The game doesn't exist" }`

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "You are unauthorized to make this request." }`


**Open Cell**
----
  Opens the cell at the specified coordinates and returns the updated json data about the game.

* **URL**

  /games/:id/cells

* **Method:**

  `PATCH`

* **Headers**

  Autorization: Bearer [your token]
  Content-Type: application/json

* **URL Params**

  **Required:**
 
  `id=[string]`

* **Data Params**
  
  **Required:**

  { x:[integer], y:[integer] }

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ id : 20, board : [[],[], ...] }`
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "The game doesn't exist" }`

  OR

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "The cell doesn't exist" }`

  OR

  * **Code:** 422 Unprocessable Entity <br />
    **Content:** `{ error : "The cell is already open (0..N) or tagged with a flag (F) or a question mark (?)" }`

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "You are unauthorized to make this request." }`


**Apply Flag**
----
  Updates the flag switch (on/off) on a cell at the specified coordinates and returns the updated json data about the game.
  It overrides any other tag on the cell.

* **URL**

  /games/:id/flags

* **Method:**

  `PATCH`

* **Headers**

  Autorization: Bearer [your token]
  Content-Type: application/json

* **URL Params**

  **Required:**
 
  `id=[string]`

* **Data Params**
  
  **Required:**

  { x:[integer], y:[integer] }

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ id : 20, board : [[],[], ...] }`
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "The game doesn't exist" }`

  OR

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "The cell doesn't exist" }`

  OR

  * **Code:** 422 Unprocessable Entity <br />
    **Content:** `{ error : "The cell is already open (0..N)" }`

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "You are unauthorized to make this request." }`


**Apply Question Mark**
----
  Updates the question mark switch (on/off) on a cell at the specified coordinates and returns the updated json data about the game.
  It overrides any other tag on the cell.

* **URL**

  /games/:id/marks

* **Method:**

  `PATCH`

* **Headers**

  Autorization: Bearer [your token]
  Content-Type: application/json

* **URL Params**

  **Required:**
 
  `id=[string]`

* **Data Params**
  
  **Required:**

  { x:[integer], y:[integer] }

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ id : 20, board : [[],[], ...] }`
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "The game doesn't exist" }`

  OR

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "The cell doesn't exist" }`

  OR

  * **Code:** 422 Unprocessable Entity <br />
    **Content:** `{ error : "The cell is already open (0..N)" }`

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "You are unauthorized to make this request." }`

