import { Component } from '@angular/core';
import { DetailPage } from '../detail/detail';
import { Platform, App, Events, AlertController } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { FilterService } from '../../providers/filter-service'


/*
  Classe de la page de la liste des essences.
*/
@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {
  private db: SQLite;
  private dbObject: SQLiteObject;

  private essences: Array<any>;

  constructor(private platform: Platform, private alertCtrl: AlertController,
    private app: App, private events: Events, private filters: FilterService, private sqlite: SQLite) {

    // Ouverture de la base de données lorsque l'application est prête
    platform.ready()
      .then(() => {
        sqlite.create({ name: "data.db", location: "default" }).then((db: SQLiteObject) => {
          this.dbObject = db;
        })
      });


    // Rafraichissement de la liste lorsque l'event "refresh" se produit
    this.events.subscribe('refresh', () => this.loadEssences());
  }

  // Affichage des informations de l'application et possibilité de mise à jour
  showAlert() {
    let alert = this.alertCtrl.create({
      title: 'À propos',
      subTitle: 'Réalisée par Dimitri Schweizer, Données fournies par Michel Juillard',
      buttons: [{ text: 'Mettre à jour', handler: () => this.events.publish('update') }, 'OK']
    });
    alert.present();
  }

  // Récupération de la liste des essences
  loadEssences() {
    let select_essences_list = "SELECT essences.wp_id, essences.nom, nom_latin," +
      "famille, type, images.chemin || images.nom AS chemin FROM essences " +
      "INNER JOIN images ON essences.wp_id = images.essence_id WHERE images.vignette = 1 ";

    if (this.filters.getIfTypeFiltered()) {
      let types = this.filters.getFilteredTypes();
      select_essences_list += "AND essences.type IN ( \'essence_" + types[0] + "\'";
      for (var i = 1; i < types.length; i++) {
        select_essences_list += " , \'essence_" + types[i] + "\'";
      }
      select_essences_list += " ) "
    }

    if (this.filters.getIfColorFiltered()) {
      let colors = this.filters.getFilteredColors();
      select_essences_list += "AND essences.couleur IN ( \'" + colors[0] + "\'";
      for (var i = 1; i < colors.length; i++) {
        select_essences_list += " , \'" + colors[i] + "\'";
      }
      select_essences_list += " ) "
    }

    select_essences_list += "ORDER BY " + this.filters.getOrderByName() + " " + (this.filters.getIfReverse() ? "DESC" : "ASC")
    return new Promise((resolve, reject) => {
      this.dbObject.executeSql(select_essences_list, [])
        .then((data) => {
          this.essences = [];
          if (data.rows.length > 0) {
            for (var i = 0; i < data.rows.length; i++) {
              this.essences.push(data.rows.item(i));
            }
          }
          resolve();
        }, (error) => {
          reject(error);
        });
    });
  }

  // Ouverture de la page de détail d'une essence
  openDetail(id: number) {
    let select_essence = "SELECT wp_id, essences.nom, nom_latin, nom_alias, " +
      "famille, type, couleur, description FROM essences WHERE wp_id = " + id;

    this.dbObject.executeSql(select_essence, []).then((data) => {
      if (data.rows.length > 0) {
        this.app.getRootNav().push(DetailPage, data.rows.item(0));
      }
    }, (error) => {
      console.log("ERROR: " + error.message);
    });
  }

  // Filtre la liste des essences selon la valeur saisie dans le champ recherche
  searchEssences(ev: any) {
    this.loadEssences().then(() => {
      // Valeur de la SearchBar
      const val = ev.target.value;

      // Trie uniquement si une valeur est saisie
      if (val && val.trim() != '') {
        this.essences = this.essences.filter((item: any) => {
          return (item.nom.toLowerCase().indexOf(val.toLowerCase()) > -1);
        });
      }
    });
  }
}
