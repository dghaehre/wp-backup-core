const Client = require('ssh2').Client
let conn = new Client()

const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max))

const connect = ({host, username, password, port}) => new Promise((resolve, reject) => {
  console.log(`Trying to login..`)
  conn.on('ready', function() {
    console.log('Login successful');
    resolve(conn)
  }).connect({ host, port, username, password })
})

const downloadFile = (conn) => new Promise((resolve, reject) => {
  console.log("Downloading files")
  conn.exec('curl -L https://raw.githubusercontent.com/dghaehre/wp-backup-core/master/backup.sh?token=ADXO5P7Y6T6WH2DAUGFLTPS53BDLW > backup.sh', handleStream(resolve, reject, conn))
})

const handleStream = (resolve, reject, conn) => (err, stream) => {
  if(err) reject(err)
  stream.on('close', function(code, signal) {
    if(code) {
      reject(`Error: ${code} ${signal}`)
    } else {
      resolve(conn)
    }
  }).on('data', function(data) {
    console.log("" + data);
  })
}

const setPermission = (conn) => new Promise((resolve, reject) => {
  console.log("Setting permissions")
  conn.exec('chmod ug+x backup.sh', handleStream(resolve, reject, conn))
})

const sedWp = ({ path, name, bucketname }) => `sed -i 's|NAME=\"examplename\"|NAME=\"${name}\"|g' ./backup.sh; sed -i 's|/path/to/wordpress|${path}|g' ./backup.sh; sed -i 's|bucketname|${bucketname}|g' ./backup.sh`

const createFiles = (key, secret) => `mkdir -p ~/.aws; echo "[default]" > ~/.aws/config; echo "[default]
aws_access_key_id = ${key}
aws_secret_access_key = ${secret}" > ~/.aws/credentials;`

const createCron = () => `crontab -l > ~/tempfile.cron; echo \"
${getRandomInt(59)} ${getRandomInt(23)} * * 0 ~/backup.sh\" >> ~/tempfile.cron; crontab ~/tempfile.cron; rm ~/tempfile.cron;`

const setWpInfo = (data) => conn => new Promise((resolve, reject) => {
  conn.exec(sedWp(data), handleStream(resolve, reject, conn))
})

const createAwsCredentials = ({ key, secret }) => conn => new Promise((resolve, reject) => {
  conn.exec(createFiles(key, secret), handleStream(resolve, reject, conn))
})

const runBackup = (conn) => new Promise((resolve, reject) => {
  conn.exec("~/backup.sh", (err, stream) => { 
    if(err) reject(err)
    stream.on('close', function(code, signal) {
      if(code) {
        reject(`Error: ${code} ${signal}`)
      } else {
        resolve(conn)
      }
    }).on('data', function(data) {
      console.log("" + data);
    })
  })
})

const createCrontab = (conn) => new Promise((resolve, reject) => {
  console.log("First backup created!")
  console.log("\nSetting up crontab..")
  conn.exec(createCron(), handleStream(resolve, reject, conn))
})

const sanitize = (data) => new Promise((resolve, reject) => {
  // Reject if data doesnt look good
  console.log(data)
  resolve(data)
})

const main = (data) => new Promise((resolve, reject) => {
  let sanitized = {}
  sanitize(data)
  .then(d => {
    sanitzed = d
    return d
  })
  .then(connect)
  .then(downloadFile)
  .then(setPermission)
  .then(setWpInfo(sanitized))
  .then(createAwsCredentials(sanitized))
  .then(runBackup)
  .then(createCrontab)
  .then(conn => {
    conn.end()
    console.log("Finished")
    resolve()
  })
  .then(finished)
  .catch(reject)
})

exports.backup = main
