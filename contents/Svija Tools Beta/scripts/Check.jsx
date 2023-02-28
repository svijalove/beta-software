#target illustrator  

//:::::::::::::::::::::::::::::::::::::::: Verify.jsx

/*———————————————————————————————————————— notes

    fixEmbeddedImage can return either warning or error depending on if image can be fixed
    we'll deal with that later

    fixEmbeddedImage (embedded images)

    to add once old functionality has been repaired
    • embedded images 
    • non-native items
    • artboard names don't match likely screen codes
    • artboard sizes don't match likely screen sizes
    • unsupported techniques (mesh, filters)
    • missing font
    • correct text tracking
    • effect › stylize
    • opacity masks
    • freeform gradients
    • layer blending modes
    • gradient midpoints
    • cloud images
    • TT automatic uppercase see JavaScript Scripting Reference p24 */

/*———————————————————————————————————————— (c) & EULA

    Copyright (c) 2019-2023 Svija

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    The software is provided "as is", without warranty of any kind, express or
    implied, including but not limited to the warranties of merchantability,
    fitness for a particular purpose and noninfringement. In no event shall the
    authors or copyright holders be liable for any claim, damages or other
    liability, whether in an action of contract, tort or otherwise, arising from,
    out of or in connection with the software or the use or other dealings in
    the software.

  	svija.com · hello@svija.com */


//:::::::::::::::::::::::::::::::::::::::: program

/*———————————————————————————————————————— ▼ program:{

    can use "break program;" to quit at any moment */

program:{ // can use "return" to quit at any time

  var d = new Date();
  var env_start_ms = d.getTime();

//———————————————————————————————————————— initialization

var env_repairs        = [];   // repaired messages for user
var env_warnings       = [];   // warnings for user
var env_errors         = [];   // error messages for user
var env_imagesModified = [];   // [name, boolean warning/error, message]

var env_imagesFixed  = [];
var env_imagesFailed = [];
  
var doc         = app.activeDocument;
var linksFolder = Folder(doc.path) + '/Links';

var nonNatives = doc.nonNativeItems.length;
var rasters = doc.rasterItems.length;
var placed  = doc.placedItems.length;

if (rasters + placed > 0) var hasImages = true;
else                      var hasImages = false;


//———————————————————————————————————————— has not saved then quit

if (!hasPath(doc)) break program;

//———————————————————————————————————————— if not in sync folder then quit

if (!inSync(doc)) break program;

//———————————————————————————————————————— check artboard names

var msg = artboardNames(doc);     // do artboard names seem likely? 

if (msg != '')
  env_errors.push(msg);

//———————————————————————————————————————— check artboard sizes

warn = artboardSizes(doc);     // do artboard sizes seem likely?

if (warn != '')
  env_warnings.push(warn);

//———————————————————————————————————————— create Links folder if necessary

if (hasImages)
  if (!Folder(linksFolder).exists){
    Folder(linksFolder).create();
    env_repairs.push('"Links" folder created for images.');
  }

/*———————————————————————————————————————— check for non-native items NOT IMPLEMENTED

   alert(nonNatives);

   there are 51 in Fusion 2018 PDF
   the function fixEmbeddedImage should be copied */

/*———————————————————————————————————————— change embedded images to linked images

    these are treated before placed images, because they will be
    changed to placed in the next step

    fixEmbeddedImage() returns image filename, succes/failure, message */

if (hasImages)
  for (var x=rasters; x>0; x--){
    var name_fixed_msg = fixEmbeddedImage(doc.rasterItems[x-1]);

    if (name_fixed_msg.length > 0){
      env_imagesModified[env_imagesModified.length] = name_fixed_msg;
      if(name_fixed_msg[1])
        placed += 1; // if it succeeded, we add a new placed image
    }
  }

/*———————————————————————————————————————— copy/move placed images to Links

    rasterItem() returns image filename, succes/failure, message */

if (hasImages)
  for (var x=placed; x>0; x--){
    var name_fixed_msg = fixPlacedImage(doc.placedItems[x-1]);

    if (name_fixed_msg.length > 0) // if something was modified
      env_imagesModified[env_imagesModified.length] = name_fixed_msg;
}

/*———————————————————————————————————————— check for illegal image formats

    reject anything but .ai, .pdf, .jpg, .png & .gif */

if (hasImages){
  for (var x=0; x<placed; x++){
    var name_fixed_msg = checkImageExt(doc.placedItems[x]);

//alert(name_fixed_msg.join(' : ');
    
    if (name_fixed_msg.length > 0) // if something was modified
      env_imagesModified[env_imagesModified.length] = name_fixed_msg;
  }
}

/*———————————————————————————————————————— separate image messages into success/failed

    two lists of messages are created:
    - fixed images
    - failed repairs

    an image that has two fixes:
    - embedded › linked
    - moved to Links

    should show only one message, the second */

if (hasImages){
  for (var x=0; x<env_imagesModified.length; x++){

    if (!env_imagesModified[x][1])
      env_imagesFailed.push(env_imagesModified[x]); // repair failed
    else{

      var nme   = env_imagesModified[x][0];
      var index = nameExists(nme, env_imagesFixed);

      if (index < 0) env_imagesFixed[env_imagesFixed.length] = env_imagesModified[x];
      else           env_imagesFixed[index] = env_imagesModified[x];
    }
  }
}

//———————————————————————————————————————— alert user
   
alertUser(doc);

//———————————————————————————————————————— ▲ } // program 

} // program 


//:::::::::::::::::::::::::::::::::::::::: primary functions · called by program

/*———————————————————————————————————————— hasPath(doc) √

    has file been saved at least once?
    if not, ask user to save

    returns true or false */

function hasPath(doc){

  if (doc.path != '') return true;

  var f = File.saveDialog('Navigate to "sync" folder then save','');

  if (f == null){
    alert('Operation Canceled');
    return false;
  }

  app.activeDocument.saveAs(f, undefined);
  return true;
    
}

/*———————————————————————————————————————— inSync(doc)

    checks if file is inside a sync folder
    and throws fatal exception if not */

function inSync(doc){
  var path = String(doc.path)
  
  if (path.indexOf('/sync') < 0){
    alert('Not a Svija Page\nPlease move this file to the folder called "sync" in your Project Folder.');
    return false;
  }

  return true;
}

/*———————————————————————————————————————— artboardNames(sourceDoc)

    artboard names have to be two-letter codes

    returns '' or warning message */

function artboardNames(doc){

  for(x=0; x<doc.artboards.length; x++)
    if (!isTwoLetters(doc.artboards[x].name))
      return doc.name + " has artboard names that are not screen codes";

  return '';

}

/*———————————————————————————————————————— artboardSizes(doc)

    do artboard sizes seem likely? (round numbers)

    returns '' or warning message */

function artboardSizes(doc){

  for(x=0; x<doc.artboards.length; x++){
    var w = doc.artboards[x].artboardRect[2]-doc.artboards[x].artboardRect[0];

    if (!isRoundNumber(w))
      return doc.name + ' has ' + w + 'px wide artboard; see Svija Cloud screen settings';
  }

  return '';
}

/*———————————————————————————————————————— hasLinks(sourceDoc) FIX

    has file been saved at least once?
    returns '' or error message */

function hasLinks(doc){

  var linksFolder = Folder(app.activeDocument.path + '/Links');

  if (Folder(linksFolder).exists)
    return '';

  var msg = 'No "Links" folder found.\nDo you want to create it?';
  if (confirm(msg)){
    Folder(linksFolder).create();
    return '';
  }
  else
    return "Missing \"Links\" folder for images";
}

/*———————————————————————————————————————— fixEmbeddedImage(obj)

    takes an embedded image and tries to change it to
    a link to an external file. Not sure what happens
    if the original cannot be found, a yellow rectangle
    is placed over the image — function drawYellowRectangle()

    returns image filename, succes/failure, message if modification
    returns [] if no change */

function fixEmbeddedImage(img){
 
  // we don't care about non-printing information layers
  if (!img.layer.printable) return [];

  //———————————————————— get access to layer

  app.activeDocument.activeLayer         = img.layer; // make layer active
  app.activeDocument.activeLayer.visible = true;      // and visible

  //———————————————————— check if original is findable

	try{
    var newName = img.file;   // usually contains original file, even if image is embedded
    var newFile = new File(newName);
    var fileMissing = false;
	}
	catch(e){ var fileMissing = true; }

  //———————————————————— original is missing: mark it and get out

  // this is a precaution, not encountered so far
  if (img.status != 'RasterLinkState.DATAFROMFILE')
    fileMissing = true;

  if(fileMissing){
    var rec = drawYellowRectangle(img);
    var msg = '(highlighted)';

    if (img.name != '') var neme =  img.name;
    else var neme = 'Missing image';

    return [neme, false, msg];
  }

  //———————————————————— re-link original file

  var placedImage  = app.activeDocument.activeLayer.placedItems.add();
  placedImage.file = newFile;

  for (var key in img)
    if (key != 'parent' && key != 'embedded' && key != 'wrapOffset' && key != 'wrapInside')
      placedImage[key] = img[key];
 
  // objects were appearing upside down
  // has bug if image already transformed

  // need to get placedImage matrix

  var moveMatrix  = app.getScaleMatrix(100,-100);
  var totalMatrix = concatenateRotationMatrix(moveMatrix, 10);

  placedImage.transform(moveMatrix);

  // remove the embedded image
  img.remove();

  var msg = 'file relinked';
  return [placedImage.file.name, true, msg];

}

/*———————————————————————————————————————— fixPlacedImage(obj)

    image can't be missing unless it
    was moved after document was opened

    returns image filename, succes/failure, message if modification
    returns [] if no change

    copy if outside of current folder, otherwise move

    three cases:
    image is far away
    image is in same folder as Ai doc
    image is in links folder already  */

function fixPlacedImage(img){
  if (!img.layer.printable) return [];

  try{ var thisFolder = img.file.path; } // not sure what would cause this
	catch(e){ return []; }                         // just in case

  var currentFolder = Folder(app.activeDocument.path);
  var linksFolder   = currentFolder + '/Links';

  if (thisFolder == linksFolder) // image is already in /Links
    return [];

  //———————————————————— need to repair

  var neme     = img.file.name;
  var destPath = linksFolder+'/'+neme;

  //———————————————————— is it a cloud image?

  var isCloud = String(img.file).indexOf('/Creative%20Cloud%20Libraries/');
  if (isCloud > 0){
    var ext = getExtension(img.file);
    neme = img.name + ' Cloud' + ext;
    destPath = linksFolder + '/' + neme;
  }
	
  //———————————————————— continue

  var newFile = new File(destPath); // hypothetical until we actually create it

  // we copy file to /Links, then if it was with AI file, we delete original
  // changing the "copy" to a "move"

  if(newFile.exists) var msg = 'link corrected';
  else{
    img.file.copy(newFile);
    var msg = 'copied to "Links" folder';
  }

  // if the file was in Ai folder we delete orig
  if (thisFolder == currentFolder){
    img.file.remove();
    var msg = 'moved to "Links" folder';
  }

  img.file = newFile;
  return [neme, true, msg];
}

/*———————————————————————————————————————— checkImageExt(img)

    exclude all but the most common image formats:

    ai|pdf|jpg|jpeg|png|gif   */


function checkImageExt(img){
  if (!img.layer.printable) return [];

  var parts = String(img.file).split('.');
  var ext = parts[parts.length - 1];
  var neme = img.file.name;

  const legalImages = /ai|pdf|jpg|jpeg|png|gif/gi;

  if (ext.match(legalImages) === null)
    return [neme, false, 'is an unsupported format'];

  return []
}

/*———————————————————————————————————————— alertUser(count)

    alert with:
    - elapsed time
    - errors (big problems)
    - warnings (minor problems)
    - image fixes
    - failed image repairs */

function alertUser(doc){

  var d = new Date();
  var ms = ' (' + (d.getTime()-env_start_ms) + ' ms)';

  var title = doc.name;
  var bodyParts = [];

  if (env_warnings.length > 0)
    bodyParts.push('— Warnings —\n' + env_warnings.join('\n'));

  if (env_errors.length > 0)
    bodyParts.push('— Errors —\n' + env_errors.join('\n'));
  
  if (env_repairs.length > 0)
    bodyParts.push('— Repairs —\n' + env_repairs.join('\n'));
  
  if (env_imagesFixed.length > 0)
    bodyParts.push('— Fixed images —\n' + convertArray(env_imagesFixed));

  if (env_imagesFailed.length > 0)
    bodyParts.push('— Unrepairable images —\n' + convertArray(env_imagesFailed));

  if (bodyParts.length == 0){
    alert('No issues found');
    return;
  }

  body = bodyParts.join('\n\n');
  var msg = decodeURI(title + '\n' + body);

  showResults = confirm(doc.name + ' verified' + ms + '\nShow report?');
  if (showResults) alert(msg);
}


//:::::::::::::::::::::::::::::::::::::::: utility functions

/*———————————————————————————————————————— drawYellowRectangle(obj)

  create translucent rectangle to signal embedded images
  that can't be found and need to be replaced */

function drawYellowRectangle(obj){
  var alertColor = new RGBColor();
  alertColor.red = 192; alertColor.green = 255; alertColor.blue = 0;
  
  var r = obj.geometricBounds; // coords [left -top right -bottom]

  var rLeft   = r[0];
  var rNegTop = r[1];
  var rWidth  = r[2]-r[0];
  var rHeight = r[1]-r[3];

  // unlock activeLayer

  var thisLayer = app.activeDocument.activeLayer;
  var layers = 1;

  var layerLocks = [[thisLayer, thisLayer.locked, thisLayer.name]];
  thisLayer.locked = false;

  while (thisLayer.parent.typename == 'Layer'){
    thisLayer = thisLayer.parent
    layerLocks[layers] = [thisLayer, thisLayer.locked, thisLayer.name];
    layers += 1;
  }

  for(var x=0; x<layers; x++)
    layerLocks[x][0].locked = false;

  // isg81 -top, left, width, height
  var rec = app.activeDocument.activeLayer.pathItems.rectangle( rNegTop, rLeft, rWidth, rHeight );

  rec.filled = true;
  rec.stroked = false;
  rec.name = 'missing image';
  rec.fillColor = alertColor;
  rec.opacity = 50;
  rec.zOrder(ZOrderMethod.SENDBACKWARD); 
  rec.zOrder(ZOrderMethod.BRINGFORWARD); 

  var imgDepth = getAlertDepth(obj);
  var recDepth = rec.absoluteZOrderPosition;

  var doc         = app.activeDocument;
  var totalItems  = doc.pageItems.length;
  var recPos      = totalItems - 1; // layer is topmost; higher numbers are in front of lower numbers

  while (rec.absoluteZOrderPosition > imgDepth+1)
    rec.zOrder(ZOrderMethod.SENDBACKWARD); 

  for(var x=0; x<layerLocks.length; x++)
    layerLocks[x][0].locked = layerLocks[x][1];

  return rec;
}


// one issue: if image is in group, rectangle is sent behind group
// if parent.typeof=group...

/*———————————————————————————————————————— hasEmbeds(doc)

    embedded images will be re-linked, converting
    them to placed images (if possible) */

function hasEmbeds(doc){

  var l = doc.fixEmbeddedImages.length;

  var fixes = [];  

  for (var x = l; x > 0; x--){

    var val = relink(doc.fixEmbeddedImages[x-1]); // val = array // returns false if non-printing layer
    if (val != false) fixes.push(val);

  }

  // prepare messages
  for (var x=0; x<fixes.length; x++){
  
    var skip = false;

    for (var y=0; y<names.length; y++)
      if (fixes[x][0] == names[y]) skip = true;

    if(skip) continue; 
  
    if (fixes[x][1]) fixed.push(fixes[x][0] + ' ' + fixes[x][2]);
    else failed.push(fixes[x][0] + ' ' + fixes[x][2]);
  }
 
}

/*———————————————————————————————————————— nameExists(list)
      
    var index = nameExists(name, env_imagesFixed);

    accepts a name, and an array of 3-element arrays
    of which the first is a name.

    if the name is found in the first element of an existing
    member of the list, return the index

    else return -1 */

function nameExists(neme, arrayList){

  for (var x=0; x<arrayList.length; x++)
    if (neme == arrayList[x][0]) return x;
  

  return -1;
}

/*———————————————————————————————————————— convertArray(envArray)

    accepts an array of three-element arrays:
    name, success/fail boolean, message

    returns string */

// empty arrays were added to beginning of envArray

function convertArray(arr){
  if (arr.length == 0) return '';

  var result = [];
  for (var x=0; x<arr.length; x++){
    result.push(arr[x][0] + ' ' + arr[x][2]);
}

  return result.join('\n');
}

//———————————————————————————————————————— isTwoLetters(str)

function isTwoLetters(str){
  if (str.length == 2) return true;
  return false;
}

/*———————————————————————————————————————— isRoundNumber(n)
    returns true if n is a nice round number:
    30, 120, 168, etc. */

// 6, 24, 336 etc.

function isRoundNumber(n){
  n = n/5;

  if (isInteger(n/3)) return true;
  if (isInteger(n/4)) return true;
  if (isInteger(n/5)) return true;
  if (isInteger(n/6)) return true;

  return false;
}

//———————————————————————————————————————— isInteger(n)

function isInteger(n){
  if (n == Math.round(n)) return true;
  else return false;
}

//———————————————————————————————————————— getExtension(path)

function getExtension(path){
  var ending = String(path).substr(-5);
  var bits = ending.split('.');
  return '.' + bits[1];
}

//———————————————————————————————————————— dumpKeys(obj)

function dumpKeys(obj){
  var str = '';

  for (var i in obj){
    try{
      str += '\n'+i+': '+obj[i].typename;
    }
    catch(e){
      str += '\n'+i+': error';
    }
  }
  alert(str);
}

/*———————————————————————————————————————— getAlertDepth(img)
    
    This exists so that yellow highlight boxes will be:
    - in front of image if image is not grouped
    - in front of group if image is grouped */

function getAlertDepth(img){

  if (img.parent.typename != 'GroupItem')
    return img.absoluteZOrderPosition;

  var obj = img;
  while (obj.parent.typename == 'GroupItem')
     obj = obj.parent;

  alert('Group depth: '+obj.absoluteZOrderPosition);
  return obj.absoluteZOrderPosition;
}

//:::::::::::::::::::::::::::::::::::::::: to add later

/*———————————————————————————————————————— nonNative(sourceDoc)

    are there non-native items?

    returns '' or warning message */

//   warn = nonNative(sourceDoc);         // are there non-native items? 
//   if (warn != '')
//     env_warnings.push(warn);
// 
// function nonNative(doc){
//   if (doc.nonNativeItems.length == 0) return '';
//   return doc.name + " may not display correctly; check the \"Links\" panel for non-native items";
// }

/*———————————————————————————————————————— liveEffects(doc)

    these are technically called "Live Effects"

    https://mark1bean.github.io/live-effect-functions-for-illustrator/

    right now I have no way to find them

    returns '' or warning message */

//   warn = liveEffects(sourceDoc);       // are there unsupported techniques?
//   if (warn != '')
//     env_warnings.push(warn);
// 
// function liveEffects(doc){
//   //alert(doc.pageItems.getByName('thisOne'));
//   return '';
// }

/*———————————————————————————————————————— missingFonts(doc)

    are there missing fonts?
    p228
    https://community.adobe.com/t5/illustrator-discussions/change-a-font-using-extendscript-in-illustrator/td-p/6322550

    returns '' or warning message */

//   warn = missingFonts(sourceDoc);      // are there missing fonts?
//   if (warn != '')
//     env_warnings.push(warn);
// 
// function missingFonts(doc){
//   return '';
// 
//   var o = doc.pageItems.getByName('thisOne'); 
//   alert(o.textRange.characterAttributes.textFont); // crashes AI
// }


//:::::::::::::::::::::::::::::::::::::::: fin

