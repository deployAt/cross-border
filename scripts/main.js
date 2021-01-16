const StellarSdk = require('stellar-sdk')

const server = new StellarSdk.Server('http://localhost:8000', { allowHttp: true })

const passphrase = 'Standalone Network ; February 2017'

// --------------- Accounts creation ---------------
const MasterKey = StellarSdk.Keypair.master(passphrase)
const MasterSecret = MasterKey.secret()
const MasterPublicKey = MasterKey.publicKey()

console.log('Master key', MasterSecret, MasterPublicKey)

const pair1 = StellarSdk.Keypair.random(passphrase)
const pair2 = StellarSdk.Keypair.random(passphrase)
const pair3 = StellarSdk.Keypair.random(passphrase)

const SecretKey1 = pair1.secret()
const PublicKey1 = pair1.publicKey()
console.log('Account1', SecretKey1, PublicKey1)

const SecretKey2 = pair2.secret()
const PublicKey2 = pair2.publicKey()
console.log('Account2', SecretKey2, PublicKey2)

const SecretKey3 = pair3.secret()
const PublicKey3 = pair3.publicKey()
console.log('Account3', SecretKey3, PublicKey3)

;(async function createAccounts() {
  const account = await server.loadAccount(MasterPublicKey)
  const fee = await server.fetchBaseFee()

  const tx = new StellarSdk.TransactionBuilder(account, { fee, networkPassphrase: passphrase })
    .addOperation(
      StellarSdk.Operation.createAccount({
        source: MasterPublicKey,
        destination: PublicKey1,
        startingBalance: '100000',
      })
    )
    .addOperation(
      StellarSdk.Operation.createAccount({
        source: MasterPublicKey,
        destination: PublicKey2,
        startingBalance: '100000',
      })
    )
    .addOperation(
      StellarSdk.Operation.createAccount({
        source: MasterPublicKey,
        destination: PublicKey3,
        startingBalance: '100000',
      })
    )
    .setTimeout(30)
    .build()

  tx.sign(MasterKey)

  try {
    const txResult = await server.submitTransaction(tx)
    console.log('Accounts creation:', 'OK!')
    usdSetUp()

  } catch (err) {
    console.log('err', err)
  }
})()


// --------------- USD asset ---------------
const issuingKeys = pair1
const receivingKeys1 = pair2
const receivingKeys2 = pair3

const USD = new StellarSdk.Asset('USD', issuingKeys.publicKey())

async function usdSetUp () {
  // Extending trustline: Account 1
  const account1 = await server.loadAccount(receivingKeys1.publicKey())
  const fee = await server.fetchBaseFee()

  const tx1 = new StellarSdk.TransactionBuilder(account1, { fee, networkPassphrase: passphrase })
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: USD,
        limit: '1000000',
        source: receivingKeys1.publicKey(),
      })
    )
    .setTimeout(100)
    .build()

  tx1.sign(receivingKeys1)

  try {
    const txResult = await server.submitTransaction(tx1)
    console.log('Tx 1:', 'OK!')
  } catch (err) {
    console.log('Tx 1:', 'Error!')
  }

  // Extending trustline: Account 2
  const account2 = await server.loadAccount(receivingKeys2.publicKey())

  const tx2 = new StellarSdk.TransactionBuilder(account2, { fee, networkPassphrase: passphrase })
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: USD,
        limit: '1000000',
        source: receivingKeys2.publicKey(),
      })
    )
    .setTimeout(100)
    .build()

  tx2.sign(receivingKeys2)

  try {
    const txResult = await server.submitTransaction(tx2)
    console.log('Tx 2:', 'OK!')
  } catch (err) {
    console.log('Tx 2:', 'Error!')
  }

  // Transfer USD to Account1
  const issuingAccount = await server.loadAccount(issuingKeys.publicKey())

  const tx3 = new StellarSdk.TransactionBuilder(issuingAccount, { fee, networkPassphrase: passphrase })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: receivingKeys1.publicKey(),
        asset: USD,
        amount: '1000',
      })
    )
    .setTimeout(100)
    .build()

  tx3.sign(issuingKeys)

  try {
    const txResult = await server.submitTransaction(tx3)
    console.log('Tx 3:', 'OK!')
  } catch (err) {
    console.log('Tx 3:', 'Error!')
  }

  // Transfer USD to Account2
  const tx4 = new StellarSdk.TransactionBuilder(issuingAccount, { fee, networkPassphrase: passphrase })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: receivingKeys2.publicKey(),
        asset: USD,
        amount: '1000',
      })
    )
    .setTimeout(100)
    .build()

  tx4.sign(issuingKeys)

  try {
    const txResult = await server.submitTransaction(tx4)
    console.log('Tx 4:', 'OK!')
  } catch (err) {
    console.log('Tx 4:', 'Error!')
  }
}
