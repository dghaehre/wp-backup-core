#!/bin/bash
#
# Requirements:
# Backup created with backup.sh
#
# Update following variables:
# Note: paths CANNOT end with /

ORGWPFOLDER=/path/to/wp # Current worpress folder
NAME="projectname" # Name of backup project
FILE="2019-11-21-12-16.tar.gz" # File to use for restoration
BUCKETNAME="bucketname"

# Manual intervention finished
AWSCMD=~/bin/aws
AWSFOLDER=~/.awsinstaller
RestoreFolder=~/restore
BUCKET="s3://$BUCKETNAME/$NAME/$FILE"

cd ~/
if [ -a $AWSCMD ]; then
  echo "Aws already installed"
else
  echo "Installing Aws.."
  mkdir -p $AWSFOLDER
  mkdir -p $AWSFOLDER/bin
  curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "$AWSFOLDER/awscli-bundle.zip"
  unzip -o $AWSFOLDER/awscli-bundle.zip -d $AWSFOLDER/bin
  $AWSFOLDER/bin/awscli-bundle/install -b $AWSCMD
  # Only configure if credentials dont exists
  if [ ! -f ".aws/credentials" ]; then
    $AWSCMD configure
  fi
fi


echo "Fetching $FILE backup"
mkdir -p $RestoreFolder

$AWSCMD s3 cp $BUCKET $RestoreFolder

echo "Fetched"

cd $RestoreFolder
tar -xzf $FILE

SQLFOLDER=$(find . -name sqlbackup)
SQLFILE=$SQLFOLDER/"$(ls $SQLFOLDER | grep .sql)"
WPCONFIG=$(find . -name wp-config.php)
WPFOLDER=${WPCONFIG/wp-config.php/""}

DBUSER=$(grep DB_USER $WPCONFIG | awk -F\' '{print$4}')
DBPASSWORD=$(grep DB_PASSWORD $WPCONFIG | awk -F\' '{print$4}')
DBHOST=$(grep DB_HOST $WPCONFIG | awk -F\' '{print$4}')
DBNAME=$(grep DB_NAME $WPCONFIG | awk -F\' '{print$4}')

cd $ORGWPFOLDER
# Use WP config of existing wp project if it exists

if [ -f "wp-config.php" ]; then
  echo "Using existing wp-config.php"
  WPCONFIG=$(find . -name wp-config.php)
  DBUSER=$(grep DB_USER $WPCONFIG | awk -F\' '{print$4}')
  DBPASSWORD=$(grep DB_PASSWORD $WPCONFIG | awk -F\' '{print$4}')
  DBHOST=$(grep DB_HOST $WPCONFIG | awk -F\' '{print$4}')
  DBNAME=$(grep DB_NAME $WPCONFIG | awk -F\' '{print$4}')
  echo "Remove backup wp-config.php"
  cd $RestoreFolder
  cd $WPFOLDER
  rm -f ./wp-config.php
fi

cd $RestoreFolder

echo "Restore database"
mysql -u $DBUSER -h $DBHOST -p$DBPASSWORD $DBNAME < $SQLFILE
echo "Finished"

echo "Restore files"
cd $ORGWPFOLDER
find . ! -name 'wp-config.php' -type f -exec rm -f {} \;
cd $RestoreFolder
cp $WPFOLDER* $ORGWPFOLDER -R
echo "Finished"

echo "Cleaning up.."
rm -R $RestoreFolder
echo "Please remove restore.sh after succesful restoration"
