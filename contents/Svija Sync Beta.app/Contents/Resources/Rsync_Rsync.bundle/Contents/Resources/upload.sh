#!/usr/bin/env bash

#  check-connection.sh
#  SvijaSync
#
#  Created by Rajesh Ramachandrakurup on 6/2/21.

remote_connection="$1"
password="$2"
success="$3"

exclusions=(
    --exclude ".DS_Store"
    --exclude ".swp"
    --exclude ".git"
    --exclude ".command"
    --exclude ".pwd"
)

# added 220205 by Andrew

#   no_images=sync/Svija/SVG\ Files/
#   jpg=.jpg
#   png=.png
#   
#   rm -rf "$no_images"*"$jpg"
#   rm -rf "$no_images"*"$png"

shopt -s extglob

svg_folder=sync/Svija/SVG\ Files/
rm -rf "$svg_folder"*.!(svg)

# end added 220205

export RSYNC_PASSWORD=$password
rsync -azq --delete "${exclusions[@]}" "sync/" $remote_connection && echo "$success"
RSYNC_PASSWORD=
