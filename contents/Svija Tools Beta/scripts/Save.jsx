#target illustrator  

/*———————————————————————————————————————— Save wCanvas.jsx

    Save wCanvas.jsx

    1.0.3

    notes:

    JSR = JavaScript Scripting Reference.pdf
    ISG = Illustrator Scripting Guide
    using ampersands in // comments causes crashes

		This same script is used for both Save as Svija
    and "Save CC (Legacy).jsx" but Version(0) is
    changed to Version(17) for the latter. */

/*———————————————————————————————————————— EULA

    Copyright (c) 2023 Svija

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

  	svija.com · hello@svija.com*/


//:::::::::::::::::::::::::::::::::::::::: program

/*———————————————————————————————————————— ▼ program:{

    can use "break program;" to quit at any moment */

program:{

  var d = new Date();
  var env_start_ms = d.getTime();

//———————————————————————————————————————— no open docs

if (app.documents.length < 1){
  alert('No open documents.');
  break program;
}

/*———————————————————————————————————————— get param if standalone

    save, all or canvas */

if (typeof param == 'undefined'){

  var msg   = 'Please enter param\nsave  all  canvas';

  var param = prompt(msg, 'save');
  if (param == null)
    param = ''; 

  const regex = /save|all|canvas/g;
  if(param.match(regex) === null){
    alert('Invalid Param\nSave operation canceled');
    break program;
  }
}

//———————————————————————————————————————— initialization

var  env_errs = [];                   // error messages for user
var  env_warn = [];                   // warnings for user
var   appDocs = app.documents;        // array of open documents
var  docsOpen = appDocs.length;       // number of open documents
var activeDoc = app.activeDocument;   // active document
var aiVersion = 0;                    // 0=default, 17=CC Legacy
var aiOpts    = aiOptions(aiVersion);

var single = param == 'all'    ? false : true; // save only frontmost doc?
var canvas = param == 'canvas' ? true : false; // save entire canvas?

//———————————————————————————————————————— "for" loop through documents

var count = 0;
var extraLayer = false;

for (var index=0; index<docsOpen; index++){

  app.activeDocument = appDocs[index];
  var sourceDoc      = app.activeDocument;

  if (isValid(sourceDoc, canvas)){

    if (sourceDoc.layers.length == 1){ // necessary so that resulting SVG
       sourceDoc.layers.add();         // won't have wrong ID
       extraLayer = true;
    }

    var activeBoard = sourceDoc.artboards.getActiveArtboardIndex();
    var pathOrig = sourceDoc.path + '/' + sourceDoc.name;

    saveSVG(sourceDoc, canvas);
  
    var aiFile = new File(pathOrig);
    sourceDoc.saveAs(aiFile, aiOpts);

    sourceDoc.artboards.setActiveArtboardIndex(activeBoard);
    count += 1;

    if (extraLayer) sourceDoc.layers[0].remove();
  }

  if (single) break;
}

//———————————————————————————————————————— restore frontmost doc and alert user

if (!single)
  app.activeDocument = activeDoc;

finalFeedback(count);

//———————————————————————————————————————— ▲ } // program 

} // program 


//:::::::::::::::::::::::::::::::::::::::: main functions

/*———————————————————————————————————————— saveSVG(doc, canvas)

  saves file as SVG:

  - saves in sync/Svija/SVG Files
  - removes any existing files that would provoke a confirmation dialog
  - deletes non-printing layers
  - saves the SVG
  - restores the non-printing layers
  - resets the locked/visible status of non-printing layers

  - if artboardName is given, use it as extension & save normally
  - else save using artboards */

function saveSVG(doc, canvas){
  if (doc.artboards.length == 1) canvas = true;

  var layerInfo = deleteNonPrintingLayers(doc); // info about locked & visible

  //———————————————————————————————— destination folder & file

  var destName  = doc.name.slice(0, -3);           // remove .ai
  var destPath  = String(app.activeDocument.path);    // current folder

  var sync = destPath.indexOf('/sync');
  destPath = destPath.substr(0,sync) + '/sync/Svija/SVG%20files';
  var destFolder = Folder(destPath);

  if (canvas)
    var destFile = Folder(destPath+'/' + destName + '_' + doc.artboards[0].name + '.svg');

  //———————————————————————————————— avoid overwrite confirmations

  for (j=0; j<doc.artboards.length; j++){
    var name = destName + '_' + doc.artboards[j].name + '.svg';
    var file = newFile(destFolder, name);
    file.remove();
  }

  //———————————————————————————————— save svg files

  var svgOpts = svgOptions(canvas);

  if (canvas)
    doc.exportFile(destFile,   ExportType.SVG, svgOpts);
  else
    doc.exportFile(destFolder, ExportType.SVG, svgOpts);

  //———————————————————————————————— restore to original state

  // restore layers
  while (doc.layers.length<layerInfo.length)
    app.undo();

  // restore layer states
  for (var r=0; r<layerInfo.length; r++){
    if (layerInfo[r] == 1 || layerInfo[r] == 3){doc.layers[r].locked  = true; }
    if (layerInfo[r] == 2 || layerInfo[r] == 3){doc.layers[r].visible = false;}
  }

  return true;
}

/*———————————————————————————————————————— isValid(doc, canvas)

    three possible results:
    • everything's fine                 return true
    • warning message, proceed anyway   return true
    • error message, skip this file     return false

    env_errs = [];                   // error messages for user
    env_warn = [];                   // warnings for user

    errors:
    • file was not yet saved, user refuses to save
    • save w/canvas, multiple artboards */

function isValid(doc, canvas){
  var err, warn;

  err = hasPath(doc);           // has file been saved at least once?
  if (err != '')
    return dontSave(err);

  err = isAi(doc);              // has file been saved at least once?
  if (err != '')
    return dontSave(err);

  err = hasFolders(doc);        // is file in a /sync/ folder?
  if (err != '')
    return dontSave(err);

  err = oneArtboard(doc, canvas); // if save-with-canvas, one artboard?
  if (err != '')
    return dontSave(err);

  err = hasLinks(doc);           // is there a Links folder?
  if (err != '')
    env_warn.push(err);

  err = hasNonNative(doc);       // are there non-native items?
  if (err != '')
    env_warn.push(err);

  err = hasEmbedded(doc);        // are there embedded images?
  if (err != '')
    env_warn.push(err);

  err = hasPlaced(doc);          // are there placed images not in Links?
  if (err != '')
    env_warn.push(err);

  return true;
}

/*———————————————————————————————————————— finalFeedback(count)

    alert with:
    - elapsed time
    - errors (files not saved)
    - warnings (files saved) */

function finalFeedback(count){

  var d = new Date();
  var ms = ' (' + (d.getTime()-env_start_ms) + ' ms)';

  switch(count){
    case  0: var title = 'File(s) Not Saved';  break;
    case  1: var title = 'File Saved' + ms;    break;
    default: var title = count + ' Files Saved' + ms;
  }

  var body = '';

  if (env_errs.length > 0)
    body += '\n' + env_errs.join('\n');
  
  if (env_warn.length > 0)
    body += '\n' + env_warn.join('\n');

  alert(title + body);
  return true;
}


//:::::::::::::::::::::::::::::::::::::::: validity functions

/*———————————————————————————————————————— hasPath(sourceDoc)

    has file been saved at least once?
    returns '' or error message */

function hasPath(doc){

  if (doc.path != '') return '';

  var f = new File(getSync()).saveDlg('','');

  if (f == null)
    return 'File ' + doc.name + ' was not saved';

  app.activeDocument.saveAs(f, undefined);
  return '';
    
}

/*———————————————————————————————————————— isAi(doc)

    just checks if file is a .ai and not a PDF
    or SVG or whatever */

function isAi(doc){
  var fileExt  = doc.name.slice(-3);

  if (fileExt != '.ai')
    return 'File ' + doc.name + ' is not a .ai file and was not saved';

  return '';
}

/*———————————————————————————————————————— hasFolders(sourceDoc)

    is file inside a /sync/ folder?
    returns '' or error message */

function hasFolders(doc){

  var folderPath = String(app.activeDocument.path);
  var syncIndex = folderPath.indexOf('/sync');

  if (syncIndex < 0) return doc.name + ' is not inside a \"sync\" folder and was not saved';

  folderPath = folderPath.substr(0,syncIndex) + '/sync/Svija/SVG%20files';

  var destFolder = Folder(folderPath);
  if(!destFolder.exists)
    return doc.name + ' was not saved ("sync/Svija/SVG Files" missing)';

  return '';
}
/*———————————————————————————————————————— oneArtboard(doc, canvas)

    if save-with-canvas, is there only one?
    returns '' or error message */

function oneArtboard(doc, canvas){ // 
  if (!canvas)                   return '';
  if (doc.artboards.length == 1) return '';

  return '"Save w/Canvas" requires a single artboard only';
}

/*———————————————————————————————————————— hasLinks(sourceDoc)

    has file been saved at least once?
    returns '' or error message */

function hasLinks(doc){

  var linksFolder = Folder(app.activeDocument.path + '/Links');

  if (!Folder(linksFolder).exists)
    return doc.name + ' has no \"Links\" folder';
  else
    return '';
}

/*———————————————————————————————————————— hasNonNative(sourceDoc)

    has file been saved at least once?
    returns '' or error message */

function hasNonNative(doc){
  if (doc.nonNativeItems.length > 0)
    return doc.name + ' contains non-native items (see "Appearance" panel)';
  else
    return '';
}

/*———————————————————————————————————————— hasEmbedded(sourceDoc)

    has file been saved at least once?
    returns '' or error message */

function hasEmbedded(doc){
  if (doc.rasterItems.length > 0)
    return doc.name + ' contains embedded images — please run "Check & Repair"';
  else
    return '';
}

/*———————————————————————————————————————— hasPlaced(sourceDoc)

    has file been saved at least once?
    returns '' or error message */

function hasPlaced(doc){
  if (doc.placedItems.length == 0) return '';

  var linksPath = String(doc.path) + '/Links/';  // ~/Desktop/svija.dev/sync/Links/

  for (var x=0; x<doc.placedItems.length; x++){

    var img = doc.placedItems[0];
    if (!img.layer.printable) continue;

    var imgPath = String(img.file); // ~/Captures/capture%2029.jpg

    // if image path is shorter, image can't be in Links folder
    if (imgPath.length < linksPath.length+4) 
      return doc.name + ' contains external image(s) — please run "Check & Repair"';

    // if image path doesn't match doc path, it can't be in links folder
    var str = imgPath.slice(0, linksPath.length);
    if (str != linksPath)
      return doc.name + ' contains external image(s) — please run "Check & Repair"';

    // if what's longer than doc path contains a /, it's in some subfolder
    var str = imgPath.slice(linksPath.length, imgPath.length);
    if (str.indexOf('/') > 0)
      return doc.name + ' contains external image(s) — please run "Check & Repair"';
  }

  return '';
}


//:::::::::::::::::::::::::::::::::::::::: utility functions

/*———————————————————————————————————————— newFile(folder, name)

    returns file to save into

    https://extendscript.docsforadobe.dev */

function newFile(folder, name) {

  var f = new File(folder + '/' + name);

  if (f.open("w")){ f.close(); } // check access rights
  else alert('File ' + f + ' could not be written');

  return f;
}

/*———————————————————————————————————————— svgOptions(canvas)

  sets options for SVG file */

function svgOptions(canvas){

  var options = new ExportOptionsSVG();

  if (canvas)
    options.saveMultipleArtboards = false;                       // Preserves all artwork outside active artboard
  else
    options.saveMultipleArtboards = true;                        // Deletes all artwork outside active artboard

  // options.artboardRange
  // options.compressed
  options.coordinatePrecision = 3;                               // Decimal Places
  options.cssProperties = SVGCSSPropertyLocation.STYLEELEMENTS;  // CSS Properties: Style Elements
  options.documentEncoding = SVGDocumentEncoding.UTF8            // Encoding:
  // options.DTD = SVGDTDVersion.SVGTINY1_1;
  options.DTD = SVGDTDVersion.SVG1_1;                            // SVG Profiles
  options.embedRasterImages = false;                             // Image Location Link
  options.fontSubsetting = SVGFontSubsetting.None;               // Fonts Subsetting
  options.fontType = SVGFontType.SVGFONT;                        // Fonts Type
  options.includeFileInfo = false;                               // Include XMP
  options.includeUnusedStyles = false;                           // Include Unused Graphic Styles
  // options.includeVariablesAndDatasets
  // options.optimizeForSVGViewer
  options.preserveEditability = false;                           // Preserve Illustrator Editing Capabilities
  options.slices = false;                                        // Include Slicing Data
  // options.sVGAutoKerning = true/false;
  options.sVGTextOnPath = false;                                 // Use <textpath> for Text on Path
  // options.typename

  // not available                                               // Output fewer <tspan> elements
  // not available                                               // Responsive

  return options;
}

/*———————————————————————————————————————— deleteNonPrintingLayers(src)

  delete any layers that are not printable
  returns array with locked & visible status of deleted layers */

function deleteNonPrintingLayers(src){
  var layersLen = src.layers.length;
  var results = new Array(layersLen);

  for (z=layersLen-1; z>=0; z--){
    results[z] = 0;
    if (!src.layers[z].printable){

      if (src.layers[z].locked){
        results[z] += 1;
        src.layers[z].locked  = false;
      }

      if (!src.layers[z].visible){ // Error 9021: Trying to delete hidden layer [layer name]
        results[z] += 2;
        src.layers[z].visible = true;
      }

      src.layers[z].remove();
    }
  }

  return results;
}

/*———————————————————————————————————————— aiOptions(version)

  options for Illustrator File
  ISG409 & JSRp84 */

function aiOptions(version){

  var options = new IllustratorSaveOptions();

  if (version > 0) // JSRp244
    options.compatibility = Compatibility['ILLUSTRATOR' + version];

  options.pdfCompatible = false; // much faster
  options.compressed    = false; // a bit faster

  return options;
}

/*———————————————————————————————————————— dontSave(err)

    permits deleting braces in function isValid */

function dontSave(err){
  env_errs.push(err);
  return false;
}

/*———————————————————————————————————————— isTwoLetters(n)

    returns true if n is two letters or numbers
    a-z, A-Z, 0-9 */

function isTwoLetters(n){
  const regex = /^[a-zA-Z\d][a-zA-Z\d]$/g
  if(n.match(regex) === null) return false
  return true;
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

/*———————————————————————————————————————— getSync()

    used when saving an unsaved document — tries to
    find a sync folder from other open documents */

function getSync(){
  for(var x=1; x<app.documents.length; x++){
    var docPath = String(app.documents[x].path);
    if (docPath.indexOf('/sync') > 0) return docPath + '/Page Name.ai';
  }
  return '~/Documents/Page Name.ai';
}


//:::::::::::::::::::::::::::::::::::::::: fin

/*———————————————————————————————————————— appendix A — all doc keys

  var res = '';
  for (var i in doc){
    try{
      res += '\n'+i+': '+doc[i].typename;
    }
    catch(e){
      res += '\n'+i+': error';
    }
  }
  alert(res);

XMPString: undefined
activeDataSet: error
activeLayer: Layer
activeView: View
artboards: Artboards
assets: Assets
brushes: Brushes
characterStyles: CharacterStyles
cloudPath: error
colorProfileName: undefined
compoundPathItems: CompoundPathItems
cropBox: undefined
cropStyle: CropOptions.Standard
dataSets: DataSets
defaultFillColor: RGBColor
defaultFillOverprint: undefined
defaultFilled: undefined
defaultStrokeCap: StrokeCap.BUTTENDCAP
defaultStrokeColor: NoColor
defaultStrokeDashOffset: undefined
defaultStrokeDashes: undefined
defaultStrokeJoin: StrokeJoin.MITERENDJOIN
defaultStrokeMiterLimit: undefined
defaultStrokeOverprint: undefined
defaultStrokeWidth: undefined
defaultStroked: undefined
documentColorSpace: DocumentColorSpace.RGB
embeddedItems: EmbeddedItems
fullName: undefined
geometricBounds: undefined
gradients: Gradients
graphItems: GraphItems
graphicStyles: GraphicStyles
gridRepeatItems: GridRepeatItems
groupItems: GroupItems
height: undefined
inkList: undefined
isCloudDocument: undefined
kinsokuSet: undefined
layers: Layers
legacyTextItems: LegacyTextItems
listStyles: ListStyles
meshItems: MeshItems
mojikumiSet: undefined
name: undefined
nonNativeItems: NonNativeItems
outputResolution: undefined
pageItems: PageItems
pageOrigin: undefined
paragraphStyles: ParagraphStyles
parent: Application
path: undefined
pathItems: PathItems
patterns: Patterns
placedItems: PlacedItems
pluginItems: PluginItems
printTiles: undefined
radialRepeatItems: RadialRepeatItems
rasterEffectSettings: RasterEffectOptions
rasterItems: RasterItems
rulerOrigin: undefined
rulerUnits: RulerUnits.Picas
saved: undefined
scaleFactor: undefined
selection: undefined
showPlacedImages: undefined
splitLongPaths: undefined
spots: Spots
stationery: undefined
stories: Stories
swatchGroups: SwatchGroups
swatches: Swatches
symbolItems: SymbolItems
symbols: Symbols
symmetryRepeatItems: SymmetryRepeatItems
tags: Tags
textFrames: TextFrames
tileFullPages: undefined
typename: undefined
useDefaultScreen: undefined
variables: Variables
variablesLocked: undefined
views: Views
visibleBounds: undefined
width: undefined */
