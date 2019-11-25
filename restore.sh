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
RestoreFolder=~/restore
BUCKET="s3://$BUCKETNAME/$NAME/$FILE"

echo "Fetching $FILE backup"
mkdir -p $RestoreFolder

$AWSCMD s3 cp $BUCKET $RestoreFolder

echo "Fetched"

cd $RestoreFolder
tar -xzf $FILE

SQLFOLDER=$(find . -name .sqlbackup)
SQLFILE=$SQLFOLDER/"$(ls $SQLFOLDER | grep .sql)"
WPCONFIG=$(find . -name wp-config.php)
WPFOLDER=${WPCONFIG/wp-config.php/""}

DBUSER=$(grep DB_USER $WPCONFIG | awk -F\' '{print$4}')
DBPASSWORD=$(grep DB_PASSWORD $WPCONFIG | awk -F\' '{print$4}')
DBHOST=$(grep DB_HOST $WPCONFIG | awk -F\' '{print$4}')
DBNAME=$(grep DB_NAME $WPCONFIG | awk -F\' '{print$4}')

echo "Restore database"
mysql -u $DBUSER -h $DBHOST -p$DBPASSWORD $DBNAME < $SQLFILE
echo "Finished"

echo "Restore files"
cp $WPFOLDER* $ORGWPFOLDER -R
echo "Finished"

echo "Cleaning up.."
rm -R $RestoreFolder
echo "Please remove restore.sh after succesful restoration"
