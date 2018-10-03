import { Component } from '@angular/core';
import { FilteredMapPage } from '../filtered-map-page/filtered-map-page';
import { NavController, NavParams, Platform, App, Events} from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { HeilbaumPhotoswipeController, PhotoswipeOptions, PhotoswipeItem, HeilbaumPhotoswipe } from "heilbaum-ionic-photoswipe";
import { FilterService } from '../../providers/filter-service';

/*
  Classe de la page de détail d'une essence.
*/
@Component({
  selector: 'page-detail',
  templateUrl: 'detail.html'
})
export class DetailPage {
  private db: SQLite;
  private dbObject: SQLiteObject;

  // Paramètres
  private wp_id: number;
  private nom: string;
  private nom_latin: string;
  private nom_alias: string;
  private famille: string;
  private type: string;
  private couleur: string;
  private description: string;

  // Couleurs et icônes
  private svgPoints: string;
  private svgFill: string;
  private typeIcon: string;

  //Variables PhotoSwipe
  protected photoswipeItems: Array<PhotoswipeItem> = [];
  protected singlePhotoswipeItem: PhotoswipeItem = null;

  constructor(private navCtrl: NavController, private navParams: NavParams, private app: App,
    private platform: Platform, /*protected pswpCtrl: HeilbaumPhotoswipeController,*/
    private filters: FilterService, private events: Events, private sqlite: SQLite) {

    // Récupération des paramètres
    this.wp_id = navParams.get("wp_id");
    this.nom = navParams.get("nom");
    this.nom_latin = navParams.get("nom_latin");
    this.nom_alias = navParams.get("nom_alias");
    this.famille = navParams.get("famille");
    this.type = navParams.get("type");
    this.couleur = navParams.get("couleur");
    this.description = navParams.get("description");

    // Ex: essence_arbre --> arbre
    this.type = this.type.split('_')[1];

    // Ouverture de la base de données puis récupération de la galerie
    sqlite.create({ name: "data.db", location: "default" })
      .then((db) => {
        this.dbObject = db;
        this.getImageGalerie()
      });

    this.setTypeIcon();
    this.setSVG();
  }

  // Récupère la galerie d'image de l'essence
  getImageGalerie() {
    let select_essence = "SELECT images.chemin || images.nom AS chemin, description, " +
      "hauteur, largeur, vignette FROM images WHERE essence_id = " + this.wp_id;

    this.dbObject.executeSql(select_essence, []).then((data) => {
      this.photoswipeItems = [];
      if (data.rows.length > 0) {
        for (var i = 0; i < data.rows.length; i++) {
          let photoswipeItem = {
            h: data.rows.item(i).hauteur,
            src: data.rows.item(i).chemin,
            title: data.rows.item(i).description,
            w: data.rows.item(i).largeur
          };

          if (data.rows.item(i).vignette == 1) {
            this.singlePhotoswipeItem = photoswipeItem;
          }

          this.photoswipeItems.push(photoswipeItem);
        }
      }
    }, (error) => {
      console.log("ERROR: " + error.message);
    });
  }

  // Définit l'icône selon le type de l'essence
  setTypeIcon() {
    switch (this.type) {
      case "arbre":
        this.typeIcon = "mdi mdi-tree mdi-24px";
        break;
      case "conifere":
        this.typeIcon = "mdi mdi-pine-tree mdi-24px";
        break;
      case "arbuste":
        this.typeIcon = "mdi mdi-barley mdi-24px";
        break;
    }
  }

  // Définit l'icône et la couleur de celui-ci selon la couleur de la corolle
  setSVG() {

    // Icône pour toutes les couleurs sauf blanc et les essences sans corolle
    this.svgPoints = "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z";

    switch (this.couleur) {
      case "blanc":
        this.svgFill = "#387ef5";
        this.svgPoints = "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z";
        break;
      case "jaune":
        this.svgFill = "#ffcf4b";
        break;
      case "violet":
        this.svgFill = "#ab69c6";
        break;
      case "bleu":
        this.svgFill = "#387ef5";
        break;
      case "orange":
        this.svgFill = "#e67e22";
        break;
      case "rose":
        this.svgFill = "#ff6ca8";
        break;
      case "rouge":
        this.svgFill = "#e74c3c";
        break;
      default:
        this.svgFill = "#387ef5";
        this.svgPoints = "M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z";
        break;
    }
  }

  // Fonction de création de la galerie PhotoSwipe
  protected pswpSingleThumbnail(): void {
    let options: PhotoswipeOptions = {
      history: false,
      clickToCloseNonZoomable: false,
      showHideOpacity: true,
      shareEl: false
    };

    const pswp: HeilbaumPhotoswipe = this.pswpCtrl.create(this.photoswipeItems, options);
    pswp.present({ animate: false });
    pswp.setLeavingOpts({ animate: false });
  }

  openDetailMap() {
    this.app.getRootNav().push(FilteredMapPage, { essence_id: this.wp_id });
  }

  filterType() {
    this.filters.resetFilters();
    switch (this.type) {
      case "arbre":
        this.filters.arbre = true;
        break;
      case "conifere":
        this.filters.conifere = true;
        break;
      case "arbuste":
        this.filters.arbuste = true;
        break;
    }

    this.events.publish('refresh');
    this.navCtrl.pop();
  }

  filterCouleur() {
    this.filters.resetFilters();
    switch (this.couleur) {
      case "blanc":
        this.filters.clr_blanc = true;
        break;
      case "jaune":
        this.filters.clr_jaune = true;
        break;
      case "violet":
        this.filters.clr_violet = true;
        break;
      case "bleu":
        this.filters.clr_bleu = true;
        break;
      case "orange":
        this.filters.clr_orange = true;
        break;
      case "rose":
        this.filters.clr_rose = true;
        break;
      case "rouge":
        this.filters.clr_rouge = true;
        break;
      case "aucune":
        this.filters.clr_aucune = true;
        break;
    }

    this.events.publish('refresh');
    this.navCtrl.pop();
  }
}
