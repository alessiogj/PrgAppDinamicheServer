# Gestione ordini
> Progetto per il corso di Applicazioni Dinamiche per il Web (2023/2024)
> dell'Università degli Studi di Verona.

Il sistema software è stato progettato per gestire gli ordini di una società commerciale.
Il sistema è composto da tre tipi di utenti: clienti, agenti e dirigenti. 
I clienti possono visualizzare i propri ordini, gli agenti possono visualizzare
e modificare gli ordini dei propri clienti e i dirigenti possono visualizzare e
modificare tutti gli ordini.
---
## Indice
2. [🚀 Avviare il progetto](#avviare-il-progetto)
3. [📚 Documentazione API](#documentazione)
4. [👨‍💻 Autori](#autori)
---
## <a id="avviare-il-progetto"></a> 🚀 Avviare il progetto
Questa applicazione è un'API RESTful costruita con Express.js che gestisce utenti, 
agenti e dirigenti. Utilizza JWT per l'autenticazione e autorizzazione. L'applicazione 
si collega a due database PostgreSQL: `webUsers` per gestire gli utenti e 
`organization` per gestire gli ordini e le informazioni relative agli agenti e clienti.

### Tecnologie utilizzate
- Node.js
- PostgreSQL

## Installazione
1. Clona il repository
    ```sh
    git clone https://github.com/alessiogj/PrgAppDinamiche.git
    ```
2. Installa le dipendenze
    ```sh
    cd <directory del progetto>
    npm install
    ```
3. Configura i database PostgreSQL
    - Crea i database `webUsers` e `organization`.
    - Configura le tabelle e inserisci i dati iniziali come necessario.

4. Configura il file `config.js` con le informazioni di accesso ai database e 
la chiave segreta per i `JWT`.
```js
module.exports = {
   jwtSecretKey: "",
   database: {
      webUsers: {
         user: "",
         host: "",
         database: "",
         password: "",
         port: 5432
      },
      organization: {
         user: "",
         host: "",
         database: "",
         password: "",
         port: 5432
      }
   }
};
```
##] Avvio dell'applicazione
Per avviare l'applicazione:
```sh
node app.js
```
L'applicazione sarà disponibile su `http://localhost:3100`.

## <a id="documentazione"></a> 📚 Documentazione API

## Autenticazione

### `POST /auth/login`
Permette agli utenti di effettuare il login.

---

**Richiesta:**
```json
{
    "username": "exampleUser",
    "password": "examplePassword"
}
```
Risposta:

- `200 OK` con il token JWT se le credenziali sono corrette.
- `401 Unauthorized` se le credenziali sono errate.
- `404 Not Found` se l'utente non esiste.
- `500 Internal Server Error` Se c'è un errore interno al database.

---

### `POST /auth/verify-token`
Permette di verificare un token JWT

**Richiesta
```json
{
    "token": "exampleToken"
}
```
Risposta:
- `200 OK` se il token è valido.
- `401 Unauthorized` se il token è scaduto o non è valido.
- `400 Bad Request` se il token non è fornito.

## Clienti

---

### `GET /customers/getIrders`

Restituisce tutti gli ordini di un cliente.

**Richiesta:**
- Header `Authorization: Bearer <jwtToken>`

**Risposta:**
- `200 OK` con un array di ordini.
- `401 Unauthorized` se il token non è valido.
- `500 Internal Server Error` Se c'è un errore interno al database.

## Agenti

---

### `GET /agents/getOrders`

Restituisce tutti gli ordini di un agente.

**Richiesta:**
- Header `Authorization: Bearer <jwtToken>`

**Risposta:**
- `200 OK` con un array di ordini.
- `401 Unauthorized` se il token non è valido.
- `500 Internal Server Error` Se c'è un errore interno al database.

---

### `PUT /agents/modifyOrder`

Modifica lo stato di un ordine.

**Richiesta:**
- Header `Authorization: Bearer <jwtToken>`
- Corpo:
```json
{
  "modifiedOrder": {
    "ord_num": 1,
    "ord_amount": 100,
    "advance_amount": 10,
    "ord_date": "2023-01-01",
    "cust_code": "C001",
    "agent_code": "A001",
    "ord_description": "Order description"
  }
}
```
**Risposta:**
- `200 OK` se l'ordine è stato modificato con successo.
- `401 Unauthorized` se il token non è valido.
- `404 Not Found` se l'ordine non esiste.
- `500 Internal Server Error` Se c'è un errore interno al database.

---

### `DELETE /agents/deleteOrder`

Elimina un ordine esistente.

**Richiesta:**
- Header `Authorization: Bearer <jwtToken>`
- Corpo:
```json
{
  "ord_num": 1
}
```

**Risposta:**
- `200 OK` se l'ordine è stato eliminato con successo.
- `401 Unauthorized` se il token non è valido.
- `404 Not Found` se l'ordine non esiste.
- `500 Internal Server Error` Se c'è un errore interno al database.

---

### `POST /agents/addOrder`

Aggiunge un nuovo ordine.

**Richiesta:**
- Header `Authorization: Bearer <jwtToken>`
- Corpo:
```json
{
  "newOrder": {
    "ord_amount": 100,
    "advance_amount": 10,
    "ord_date": "2023-01-01",
    "cust_code": "C001",
    "agent_code": "A001",
    "ord_description": "Order description"
  }
}
```

**Risposta:**
- `200 OK` se l'ordine è stato aggiunto con successo.
- `401 Unauthorized` se il token non è valido.
- `500 Internal Server Error` Se c'è un errore interno al database.

---

### `GET /agents/getAvailableCustomers`

Restituisce tutti i clienti disponibili.

**Richiesta:**
- Header `Authorization: Bearer <jwtToken>`

**Risposta:**
- `200 OK` con un array di clienti.
- `401 Unauthorized` se il token non è valido.
- `500 Internal Server Error` Se c'è un errore interno al database.

## Dirigenti

---

### `GET /dirigents/getOrders`

Restituisce tutti gli ordini.

**Richiesta:**
- Header `Authorization: Bearer <jwtToken>`

**Risposta:**
- `200 OK` con un array di ordini.
- `401 Unauthorized` se il token non è valido.
- `500 Internal Server Error` Se c'è un errore interno al database.
---
### `GET /agents/getAvailableCustomers`

Restituisce tutti i clienti disponibili.

**Richiesta:**
- Header `Authorization: Bearer <jwtToken>`

**Risposta:**
- `200 OK` con un array di clienti.
- `401 Unauthorized` se il token non è valido.
- `500 Internal Server Error` Se c'è un errore interno al database.
---
### `PUT /dirigents/modifyOrder`

Modifica un ordine esistente.

**Richiesta:**
- Header `Authorization: Bearer <jwtToken>`
- Corpo:
```json
{
   "modifiedOrder": {
      "ord_num": 1,
      "ord_amount": 100,
      "advance_amount": 10,
      "ord_date": "2023-01-01",
      "cust_code": "C001",
      "agent_code": "A001",
      "ord_description": "Order description"
   }
}
```

**Risposta:**
- `200 OK` se l'ordine è stato modificato con successo.
- `401 Unauthorized` se il token non è valido.
- `404 Not Found` se l'ordine non esiste.
- `500 Internal Server Error` Se c'è un errore interno al database.
---
## <a id="autori"></a> Autori
- [Alessio Gjergji](https://github.com/alessiogj)
- [Nicolò Piccoli](https://github.com/nickkpiccoli)
- [Lorenzo Donatiello](https://github.com/LoryDona)