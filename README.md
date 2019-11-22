# Backup Wordpress to Amazon S3

This project includes one bash script that installs and creates a backup that it stores on your Amazon S3. This project is also a npm module which can be used to install the bashscript on the relevant server and setup weekly cronjob.

wp-backup-core usage:

`yarn add wp-backup-core`

```js
import { backup } from 'wp-backup-core'

backup({
 key: "your AWS key",
 secret: "your AWS secret",
 bucketname: "Name of AWS S3 bucket",
 host: "host ip or domain",
 username: "username of host",
 password: "password of host",
 port: "port for ssh login"
})
.then(() => console.log("success"))
.catch(console.log)

```
