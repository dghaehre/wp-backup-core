#!/bin/bash
#
# Requirements:
# - curl
# - unzip
#
# Credentials from Amazon ready
#
# Important!
# update credentials and vaiables:
# Note: paths CANNOT end with /

NAME="test"
BUCKETNAME="test"
WPROOT="/path/to/wordpress"

# Manual intervention finished
AWSCMD=~/bin/aws
BUCKET="s3://$BUCKETNAME/$NAME/$(date +"%Y-%m-%d-%H-%M").tar.gz"
AWSFOLDER=~/.awsinstaller
BKPDIR=~/.aws-backup
TEMP=~/sqlbackup
DBUSER=$(grep DB_USER $WPROOT/wp-config.php | awk -F\' '{print$4}')
DBNAME=$(grep DB_NAME $WPROOT/wp-config.php | awk -F\' '{print$4}')
DBPASSWORD=$(grep DB_PASSWORD $WPROOT/wp-config.php | awk -F\' '{print$4}')
DBHOST=$(grep DB_HOST $WPROOT/wp-config.php | awk -F\' '{print$4}')
DBDUMP="$TEMP"/"$DBNAME"_$(date +"%Y-%m-%d-%H-%M").sql
FINALDUMP="$BKPDIR"/"$NAME"_$(date +"%Y-%m-%d_%H-%M").tar.gz

echo "Install dependencies.."
cd ~/
if [ -a $AWSCMD ]; then
  echo "Aws already installed"
else
  mkdir -p $AWSFOLDER
  mkdir -p $AWSFOLDER/bin
  curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "$AWSFOLDER/awscli-bundle.zip"
  unzip $AWSFOLDER/awscli-bundle.zip -d $AWSFOLDER/bin
  $AWSFOLDER/bin/awscli-bundle/install -b $AWSCMD
  # Only configure if credentials dont exists
  if [ ! -f ".aws/credentials" ]; then
    $AWSCMD configure
  fi
fi

echo "Create backup"
mkdir -p $BKPDIR
mkdir -p $TEMP
mysqldump -h $DBHOST -u $DBUSER -p$DBPASSWORD $DBNAME > $DBDUMP
tar -czvf $FINALDUMP $WPROOT $TEMP

echo "Send backup to Amazon S3"

$AWSCMD s3 cp $FINALDUMP $BUCKET

rm -R -f $TEMP
rm -R -f $BKPDIR
rm -R -f $AWSFOLDER

echo "Finished"

