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
  conn.exec('curl -L https://raw.githubusercontent.com/dghaehre/wp-backup-core/master/backup.sh > backup.sh', handleStream(resolve, reject, conn))
})

const downloadRestoreFile = (conn) => new Promise((resolve, reject) => {
  console.log("Downloading files")
  conn.exec('curl -L https://raw.githubusercontent.com/dghaehre/wp-backup-core/master/restore.sh > restore.sh', handleStream(resolve, reject, conn))
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
    //console.log("" + data);
  })
}

const setPermission = filename => (conn) => new Promise((resolve, reject) => {
  console.log("Setting permissions")
  conn.exec(`chmod ug+x ${filename}`, handleStream(resolve, reject, conn))
})

const sedWpInit = ({ path, name, bucketname }) => `sed -i 's|NAME=\"examplename\"|NAME=\"${name}\"|g' ./backup.sh; sed -i 's|/path/to/wordpress|${path}|g' ./backup.sh; sed -i 's|bucketname|${bucketname}|g' ./backup.sh`

const sedWp = ({ path, name, bucketname }) => {
  let updateName = ""
  if(name !== null && name !== "") {
    updateName = `sed -i 's|NAME=".*"|NAME="${name}"|g' ./backup.sh; `
  }
  return `${updateName}sed -i 's|WPROOT=".*"|WPROOT="${path}"|g' ./backup.sh; sed -i 's|BUCKETNAME=".*"|BUCKETNAME="${bucketname}"|g' ./backup.sh`
}

const sedRestore = ({ path, name, filename, bucketname }) => `sed -i 's|/path/to/wp|${path}|g' ./restore.sh; sed -i 's|2019-11-21-12-16.tar.gz|${filename}|g' ./restore.sh; sed -i 's|projectname|${name}|g' ./restore.sh; sed -i 's|bucketname|${bucketname}|g' ./restore.sh`

const createFiles = (key, secret) => `mkdir -p ~/.aws; echo "[default]" > ~/.aws/config; echo "[default]
aws_access_key_id = ${key}
aws_secret_access_key = ${secret}" > ~/.aws/credentials;`

const createCron = () => `crontab -l > ~/tempfile.cron; echo \"
${getRandomInt(59)} ${getRandomInt(23)} * * 0 ~/backup.sh\" >> ~/tempfile.cron; crontab ~/tempfile.cron; rm ~/tempfile.cron;`

const setWpInfo = (data, init=true) => conn => new Promise((resolve, reject) => {
  if(init) {
    conn.exec(sedWpInit(data), handleStream(resolve, reject, conn))
  } else {
    conn.exec(sedWp(data), handleStream(resolve, reject, conn))
  }
})

const setRestoreInfo = data => conn => new Promise((resolve, reject) => {
  conn.exec(sedRestore(data), handleStream(resolve, reject, conn))
})

const createAwsCredentials = ({ key, secret }) => conn => new Promise((resolve, reject) => {
  conn.exec(createFiles(key, secret), handleStream(resolve, reject, conn))
})

const run = filename => (conn) => new Promise((resolve, reject) => {
  conn.exec(`~/${filename}`, (err, stream) => { 
    if(err) reject(err)
    stream.on('close', function(code, signal) {
      if(code) {
        reject(`Error: ${code} ${signal}`)
      } else {
        resolve(conn)
      }
    }).on('data', function(data) {
      //console.log("" + data);
    })
  })
})

const createCrontab = (conn) => new Promise((resolve, reject) => {
  console.log("First backup created!")
  console.log("\nSetting up crontab..")
  conn.exec(createCron(), handleStream(resolve, reject, conn))
})

const sanitize = (data) => {
  // Reject if data doesnt look good
  console.log(data)
  return data
}

const backup = (data) => new Promise((resolve, reject) => {
  try {
    let sanitized = sanitize(data)

    connect(sanitized)
    .then(downloadFile)
    .then(setPermission("backup.sh"))
    .then(setWpInfo(sanitized))
    .then(createAwsCredentials(sanitized))
    .then(run("backup.sh"))
    .then(createCrontab)
    .then(conn => {
      conn.end()
      console.log("Finished")
      resolve()
    })
    .catch(reject)

  } catch(err) {
    reject(err)
  }
})

/**
 * username
 * host
 * password
 * port
 * path
 * name
 * bucketname
 * filename
 * key
 * secret
 */
const restore = (data) => new Promise((resolve, reject) => {
  try {

    connect(data)
    .then(downloadRestoreFile)
    .then(setPermission("restore.sh"))
    .then(setRestoreInfo(data))
    .then(createAwsCredentials(data))
    .then(run("restore.sh"))
    .then(conn => {
      conn.end()
      console.log("Finished")
      resolve()
    })
    .catch(reject)

  } catch(err) {
    reject(err)
  }
})


/**
 * Create backup when weekly backup has already been initialized
 *
 * username
 * host
 * password
 * port
 * path
 * name
 * bucketname
 * key
 * secret
 */
const singleBackup = data => new Promise((resolve, reject) => {
  try {

    let sanitized = sanitize(data)

    connect(sanitized)
    .then(downloadFile)
    .then(setPermission("backup.sh"))
    .then(setWpInfo(sanitized))
    .then(createAwsCredentials(sanitized))
    .then(run("backup.sh"))
    .then(conn => {
      conn.end()
      console.log("Finished")
      resolve()
    })
    .catch(reject)
  } catch(err) {
    reject(err)
  }
})

exports.backup = backup
exports.restore = restore
exports.singleBackup = singleBackup
