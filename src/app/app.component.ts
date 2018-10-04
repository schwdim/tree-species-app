import { Component } from '@angular/core';
import { Platform, AlertController, LoadingController, Events } from 'ionic-angular';
import { Http } from '@angular/http';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { File } from '@ionic-native/file';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';

import { TabsPage } from '../pages/tabs/tabs';

declare var cordova: any;

/*
  Classe de principale de l'application.
*/
@Component({ templateUrl: 'app.html' })
export class MyApp {
  public rootPage = TabsPage;

  private storageDirectory: string = '';
  private db: SQLite;
  private dbObject: SQLiteObject;

  private loader: any;
  private lastUpdate: number;

  constructor(private platform: Platform, private http: Http,
    private alertCtrl: AlertController, private loading: LoadingController,
    private events: Events, private statusBar: StatusBar, private splashScreen: SplashScreen,
    private sqlite: SQLite, private file: File, private fileTransfer: FileTransfer) {

    // Initialisation de la popup de chargement
    this.loader = this.loading.create({
      content: 'Mise à jour du contenu...',
    });

    // Attente de la plateforme
    platform.ready()
      .then(() => {
        statusBar.styleDefault();
        splashScreen.hide();

        // Détermine le lieu de stockage des images selon la plateforme
        if (platform.is('ios')) {
          this.storageDirectory = cordova.file.documentsDirectory;
        } else if (platform.is('android')) {
          this.storageDirectory = cordova.file.dataDirectory;
        }

        // Ouverture et initialisation de la base de données
        sqlite.create({ name: "data.db", location: "default" })
          .then((db: SQLiteObject) => this.initDB(db))
          .then(() => this.downloadIfUpdate())
          .then(() => {
            // Rafraichissement des pages
            this.events.publish('refresh');
            this.loader.dismiss();
          })
          .catch(error => console.log(error));

        this.events.subscribe('update', () => {
          this.downloadIfUpdate(true)
            .then(() => {
              this.events.publish('refresh');
              this.loader.dismiss();
            })
            .catch(error => console.log(error));
        });
      });
  }

  // Création des tables si celles-ci n'existent pas
  initDB(db: SQLiteObject) {
    this.dbObject = db;

    return new Promise((resolve, reject) => {
      let create_tb_essences = "CREATE TABLE IF NOT EXISTS essences (id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "wp_id INTEGER, date REAL, nom TEXT, nom_latin TEXT, nom_alias TEXT, famille TEXT, " +
        "type TEXT, couleur TEXT, description TEXT)";

      let create_tb_arbres = "CREATE TABLE IF NOT EXISTS arbres (id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "wp_id INTEGER, essence_id INTEGER, date REAL, latitude REAL, longitude REAL, visibilite TEXT, " +
        "remarquable INTEGER)";

      let create_tb_images = "CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "wp_id INTEGER, essence_id INTEGER, date TEXT, description TEXT, chemin TEXT, nom TEXT, " +
        "hauteur INTEGER, largeur INTERGER, vignette INTEGER)";

      this.dbObject.executeSql(create_tb_essences, {} as any)
        .then(() => this.dbObject.executeSql(create_tb_arbres, {} as any))
        .then(() => this.dbObject.executeSql(create_tb_images, {} as any))
        .then(() => {
          // Rafraichissement des pages
          console.log("Tables were created");
          this.events.publish('refresh');
          resolve();
        })
        .catch(error => reject(error));
    })
  }

  // Télécharge les données si celle-ci ont été modifiées depuis la dernière mise à jour
  downloadIfUpdate(wasCalledByUser: boolean = false) {
    return new Promise((resolve, reject) => {
      this.lastUpdate = 0;

      let select_union = "SELECT MAX(date) AS date FROM (SELECT date FROM essences " +
        "UNION SELECT date FROM arbres)";

      this.dbObject.executeSql(select_union, {} as any).then((data) => {
        if (data.rows.item(0).date != null) {
          // Des données sont déjà présentes dans l'application
          this.lastUpdate = data.rows.item(0).date;
        }
        this.getIfUpdate().then(result => {
          if (result == true) {
            // N'affiche pas la popup si la fonction est appelée par l'utilisateur
            if (!wasCalledByUser) {
              // Popup de proposition de mise à jour
              let updateAlert = this.alertCtrl.create({
                title: 'Mise à jour',
                message: 'Le contenu de l\'application a été modifié. Souhaitez-vous télécharger celui-ci ?',
                buttons: [
                  {
                    text: 'Annuler',
                    handler: () => reject('Update was cancelled')
                  },
                  {
                    text: 'Télécharger',
                    handler: () => {
                      this.loader.present();
                      this.downloadData()
                        .then(() => this.deleteUnused())
                        .then(() => resolve())
                        .catch(error => reject(error));
                    }
                  }
                ]
              });
              updateAlert.present();
            } else {
              this.loader.present();
              this.downloadData()
                .then(() => this.deleteUnused())
                .then(() => resolve())
                .catch(error => reject(error));
            }
          }
        });
      }, (error) => {
        console.log(error);
        console.error("SQLite:", "Could not execute request");
      })
    });
  }

  // Récupère et sauvegarde localement les données
  downloadData() {
    return new Promise((resolve, reject) => {
      this.getEssences()
        .then(result => this.insertEssences(result, 0))
        .then(() => this.getArbres())
        .then(result => this.insertArbres(result, 0))
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }

  // Retourne une promesse des données de l'API
  getEssences() {
    return this.http
      .get('https://arbres.divtec.me/wp-json/v2/essences?date=' + this.lastUpdate)
      .map(res => res.json())
      .toPromise();
  }

  // Fonction récursive qui stocke les essences et les images
  insertEssences(essences, i) {
    return new Promise((resolve, reject) => {
      if (essences == null) {
        resolve();
      }

      if (i < essences.length) {
        let file;
        let imageData;
        this.insertEssence(essences[i])
          .then(() => this.getImage(essences[i].vignette))
          .then(result => {
            imageData = result;
            file = result.guid.rendered.substring(result.guid.rendered.lastIndexOf('/') + 1);
            this.downloadImage(imageData, file);
          })
          .then(() => this.insertImage(imageData, essences[i].id, file, 1))
          .then(() => {
            if (essences[i].images != false) {
              this.getGalerie(essences[i].images.split(','), essences[i].id, 0);
            }
          })
          .then(() => {
            i += 1;
            resolve(this.insertEssences(essences, i));
          })
          .catch(error => reject(error));
      } else {
        resolve();
      }
    });
  }

  // Retourne une promesse des données de l'API
  getArbres(date = 0) {
    return this.http
      .get('https://arbres.divtec.me/wp-json/v2/arbres?date=' + date)
      .map(res => res.json())
      .toPromise();
  }

  // Fonction récursive qui stocke les arbres localement
  insertArbres(arbres, i) {
    return new Promise((resolve, reject) => {
      if (arbres == null) {
        resolve();
      }
      if (i < arbres.length) {
        this.insertArbre(arbres[i])
          .then(() => {
            i += 1;
            resolve(this.insertArbres(arbres, i));
          })
          .catch(error => reject(error));
      } else {
        resolve();
      }
    });
  }

  // Insertion des données dans la table essences
  insertEssence(apiData) {
    let insert_or_replace = "INSERT OR REPLACE INTO essences (id, wp_id, date, nom, nom_latin, nom_alias, famille, " +
      "type, couleur, description) values ((SELECT id FROM essences WHERE wp_id = \'" + apiData.id + "\'), " +
      "\'" + apiData.id + "\', \'" + apiData.modified_date + "\', \'" + apiData.title +
      "\', \'" + apiData.nom_latin + "\', \'" + apiData.nom_alias + "\', \'" + apiData.famille + "\', \'" + apiData.type + "\', \'" + apiData.couleur +
      "\', \'" + apiData.description.replace(/\'/g, '\'\'') + "\')";

    return this.dbObject.executeSql(insert_or_replace, {} as any);
  }

  // Insertion des données dans la table arbres
  insertArbre(apiData) {
    let insert_or_replace = "INSERT OR REPLACE INTO arbres (id, wp_id, essence_id, date, latitude, longitude, " +
      "visibilite, remarquable) values ((SELECT id FROM arbres WHERE wp_id = \'" + apiData.id + "\'), " +
      "\'" + apiData.id + "\', \'" + apiData.essence_id + "\', \'" + apiData.modified_date +
      "\', \'" + apiData.latitude + "\', \'" + apiData.longitude + "\', \'" + apiData.visibilite + "\', \'" + apiData.remarquable + "\')";

    return this.dbObject.executeSql(insert_or_replace, {} as any);
  }

  // Récupère et stocke la galerie d'image propre a une essence_id
  getGalerie(images: Array<string>, essence_id: number, i: number) {
    return new Promise((resolve, reject) => {
      if (i < images.length) {
        let imageData;
        let file;

        this.getImage(images[i])
          .then(result => {
            imageData = result;
            file = result.guid.rendered.substring(result.guid.rendered.lastIndexOf('/') + 1);
            this.downloadImage(imageData, file);
          })
          .then(() => this.insertImage(imageData, essence_id, file))
          .then(() => {
            i += 1;
            resolve(this.getGalerie(images, essence_id, i));
          })
          .catch(error => reject(error));
      } else {
        resolve();
      }
    });
  }

  // Retourne une promesse d'une image de l'API
  getImage(image: string) {
    return this.http.get('https://arbres.divtec.me/wp-json/wp/v2/media/' + image).map(res => res.json()).toPromise();
  }

  // Télécharge une image
  downloadImage(data, file) {
    return new Promise((resolve, reject) => {
      if (data != null) {
        let imageUrl;

        const transfer: FileTransferObject = this.fileTransfer.create();

        if (data.media_details.sizes.appsize == undefined) {
          imageUrl = data.guid.rendered;
        } else {
          imageUrl = data.media_details.sizes.appsize.source_url;
        }

        transfer.download(imageUrl, this.storageDirectory + file)
          .then(() => resolve())
          .catch(error => reject(error));
      } else {
        resolve();
      }
    });
  }

  // Insertion d'une image dans la table image
  insertImage(data, essence_id, file, vignette = 0) {
    let insert_or_replace = "INSERT OR REPLACE INTO images (id, wp_id, essence_id, date, " +
      "description, chemin, nom, hauteur, largeur, vignette) VALUES" +
      "((SELECT id FROM images WHERE wp_id = \'" + data.id + "\'), \'" + data.id + "\'," +
      "\'" + essence_id + "\', \'" + data.modified + "\', \'" + data.caption.rendered +
      "\', \'" + this.storageDirectory + "\', \'" + file + "\', \'" + data.media_details.height +
      "\', \'" + data.media_details.width + "\', \'" + vignette + "\')";

    return this.dbObject.executeSql(insert_or_replace, {} as any)
  }

  // Vérifie si les données ont été mises à jour
  getIfUpdate() {
    return this.http
      .get('https://arbres.divtec.me/wp-json/v2/update?date=' + this.lastUpdate)
      .map(res => res.json())
      .toPromise();
  }

  // Supression des éléments inutilisées après la mise à jour
  deleteUnused() {
    return new Promise((resolve, reject) => {
      this.getArbresIds()
        .then(result => this.deleteArbres(result))
        .then(() => this.getEssencesIds())
        .then(result => this.deleteEssences(result))
        .then(() => this.getImagesIds())
        .then(result => this.selectImagesToDelete(result))
        .then(result => this.deleteImages(result, 0))
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }

  // Retourne une promesse de la liste des identifiants des essences de l'API
  getEssencesIds() {
    return this.http
      .get('https://arbres.divtec.me/wp-json/v2/essences/id')
      .map(res => res.json())
      .toPromise();
  }

  // Supprime toutes les essences obsolètes
  deleteEssences(apiData) {
    if (apiData != null) {
      let delete_if_not_contained = "DELETE FROM essences WHERE wp_id NOT IN (" + apiData[0];
      for (var i = 1; i < apiData.length; i++) {
        delete_if_not_contained += ", " + apiData[i];
      }
      delete_if_not_contained += ")";

      return this.dbObject.executeSql(delete_if_not_contained, {} as any);
    }
  }

  // Retourne une promesse de la liste des identifiants des arbres de l'API
  getArbresIds() {
    return this.http
      .get('https://arbres.divtec.me/wp-json/v2/arbres/id')
      .map(res => res.json())
      .toPromise();
  }

  // Supprime tous les arbres obsolètes
  deleteArbres(apiData) {
    if (apiData != null) {
      let delete_if_not_contained = "DELETE FROM arbres WHERE wp_id NOT IN (" + apiData[0];
      for (var i = 1; i < apiData.length; i++) {
        delete_if_not_contained += ", " + apiData[i];
      }
      delete_if_not_contained += ")";

      return this.dbObject.executeSql(delete_if_not_contained, {} as any)
    }
  }

  // Retourne une promesse de la liste des identifiants des images de l'API
  getImagesIds() {
    return this.http
      .get('https://arbres.divtec.me/wp-json/v2/images/id')
      .map(res => res.json())
      .toPromise();
  }

  // Sélectionne les images obsolètes dans la base de données
  selectImagesToDelete(apiData) {
    if (apiData != null) {
      let select_if_not_contained = "SELECT wp_id, chemin, nom FROM images " +
        "WHERE wp_id NOT IN (" + apiData[0];
      for (var i = 1; i < apiData.length; i++) {
        select_if_not_contained += ", " + apiData[i];
      }
      select_if_not_contained += ")";

      return this.dbObject.executeSql(select_if_not_contained, {} as any);
    }
  }

  // Fonction récursive qui supprime les images de la base et du terminal
  deleteImages(dbData, i) {
    return new Promise((resolve, reject) => {
      if (dbData.rows.length > 0 && i < dbData.rows.length) {
        let delete_id = "DELETE FROM images WHERE wp_id = " + dbData.rows.item(i).wp_id;

        this.file.removeFile(dbData.rows.item(i).chemin, dbData.rows.item(i).nom)
          .then(() => this.dbObject.executeSql(delete_id, {} as any))
          .then(() => {
            i += 1;
            resolve(this.deleteImages(dbData, i));
          })
          .catch(error => reject(error));
      } else {
        resolve();
      }
    });
  }
}
