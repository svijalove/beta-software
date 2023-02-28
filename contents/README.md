[logo]: http://files.svija.love/github/readme-logo.png "Svija: SVG-based websites built in Adobe Illustrator"

now called distribution

---

and copy to DMG repository

Code-signing is a delicate process and Illustrator is very picky about it.

**After pasting the correct icon**, install the new version of Svija Tools and **verify that the panel displays correctly** before proceeding.

If all goes well, copy Svija Tools to the **dmg-installation** repository.

---

*Updated 19 May, 2022 · Toulouse*

![Svija: SVG-based websites built in Adobe Illustrator][logo]

# DMG Installation 1.0.6 open [Svija Tools.png][stp] 


The following instructions apply to all DMG's:

1. Update the **contents** folder in this repository

2. Open **dmg-files/Svija Install RW.dmg**, show hidden files and delete everything (cmd-alt-del)

3. Copy all **visible** contents from the folder to the dmg

4. Add dots before the names of the following files:

>- install_bg.png
>- VolumeIcon.icns
>- metadata_never_index

5. Enable **.VolumeIcon.icns**

```
SetFile -c icnC   # drag ICNS from writeable DMG
SetFile -a C      # drag writeable DMG
```

6. **Hide the sidebar, toolbar and status bar** (five items should say **Show** in the View menu)

*Note: it should not be necessary to update the background images.*

>- to install an icon, open the PNG in Preview, copy it then paste it into the info window

7. View as icons and **verify the visual arrangement** of the RW DMG (leave extra space at bottom in case the user has the status bar visible)

8. Eject the DMG, then use **Disk Utility** to make a **compressed** version of the DMG **without RW** in the name (Images › Convert)

9. upload the new DMG to **store.svija.love/[product name]**

*metadata_never_index serves to prevent Spotlight indexing, and thus prevents hidden folders from being added*

---
### Github Release

On Github, create a new release from the master branch · [link](https://github.com/svijalove/dmg-installation/releases)

- use the current version number
- use the month & year for the title
- use the changelog text for the description

---
### Finalizing the version

To finish:
- update the version number in this document
- commit the new version
