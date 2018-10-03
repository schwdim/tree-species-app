import { Component } from '@angular/core';
import { DetailPage } from '../detail/detail';
import { Platform, App, Events, AlertController } from 'ionic-angular';
import { SQLite , SQLiteObject } from '@ionic-native/sqlite';
import { Geolocation } from '@ionic-native/geolocation';
import { FilterService } from '../../providers/filter-service'


import * as L from 'leaflet';

const OPT_GEOLOCATION = { maximumAge: 12000, timeout: 5000, enableHighAccuracy: false };

@Component({
  selector: 'page-map',
  templateUrl: 'map.html'
})
export class MapPage {
  private db: SQLite;
  private dbObject: SQLiteObject;

  // Variable propre à la carte et géolocation
  private map: any;
  private center: { lat: number, lng: number };
  private userMarker: L.Marker;
  private marker: L.Marker;
  private markers: L.MarkerClusterGroup;
  private following = false;
  private subscription: any;
  private mapBounds: any;

  private arbres: Array<Object>;

  constructor(private platform: Platform, private events: Events, private app: App,
    private geolocation: Geolocation, private alertCtrl: AlertController,
    private filters: FilterService, private sqlite: SQLite) {
    platform.ready().then(() => {
      sqlite.create({ name: "data.db", location: "default" }).then((db) => {
        this.dbObject = db;
        this.center = { lat: 47.417917, lng: 7.075420 };
        this.initMap();
        this.loadArbres()
      });
    });

    // Rafraichissement de la liste lorsque l'event "refresh" se produit
    this.events.subscribe('refresh', () => this.loadArbres());
  }

  // Affichage des informations de l'application et possibilité de mise à jour
  showAlert() {
    let alert = this.alertCtrl.create({
      title: 'À propos',
      subTitle: 'Réalisée par Dimitri Schweizer, Données fournies par Michel Juillard',
      buttons: [
        {
          text: 'Mettre à jour',
          handler: () => {
            this.events.publish('update');
          }
        },
        {
          text: 'Ok'
        }
      ]
    });
    alert.present();
  }

  // Récupération de la liste des arbres
  loadArbres() {
    let select_arbres = "SELECT essences.wp_id, nom, nom_latin, nom_alias, " +
      "famille, essence_id, latitude, longitude, visibilite, remarquable FROM essences " +
      "INNER JOIN arbres ON essences.wp_id = arbres.essence_id ";

    if (this.filters.getIfTypeFiltered()) {
      let types = this.filters.getFilteredTypes();
      select_arbres += "AND essences.type IN ( \'essence_" + types[0] + "\'";
      for (var i = 1; i < types.length; i++) {
        select_arbres += " , \'essence_" + types[i] + "\'";
      }
      select_arbres += " ) "
    }

    if (this.filters.getIfColorFiltered()) {
      let colors = this.filters.getFilteredColors();
      select_arbres += "AND essences.couleur IN ( \'" + colors[0] + "\'";
      for (var i = 1; i < colors.length; i++) {
        select_arbres += " , \'" + colors[i] + "\'";
      }
      select_arbres += " ) "
    }

    this.dbObject.executeSql(select_arbres, []).then((data) => {
      this.arbres = [];
      if (data.rows.length > 0) {
        for (var i = 0; i < data.rows.length; i++) {
          this.arbres.push(data.rows.item(i));
        }

        // Suppression des anciens arbres sur la carte
        if (this.markers != null) {
          this.map.removeLayer(this.markers);
        }
        this.markers = L.markerClusterGroup();

        // Ajout des arbres sur la carte
        for (let arbre of this.arbres) {
          this.drawMarker(arbre);
        }

        this.map.addLayer(this.markers);
      }
    }, (error) => {
      console.log("ERROR: " + error.message);
    });
  }

  // Initialisation de la carte
  initMap() {
    // Limite de la carte
    this.mapBounds = L.latLngBounds(L.latLng(47.439642, 7.008163), L.latLng(47.391487, 7.140775));

    this.map = L.map('map', {
      center: this.center,
      zoom: 15,
      minZoom: 13,
      maxBounds: this.mapBounds
    });

    L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.toggleFollow();
  }

  // Ajout d'un arbre sur la carte
  drawMarker(arbre) {
    var treeIcon = L.icon({
      iconUrl: 'assets/images/tree.png',
      iconSize: [21, 34],
      iconAnchor: [10.5, 17],
      popupAnchor: [0, -10]
    });

    this.marker = L.marker({ lat: arbre.latitude, lng: arbre.longitude }, { icon: treeIcon });

    this.marker.on('click', () => {
      let updateAlert = this.alertCtrl.create({
        title: arbre.nom,
        message: 'Famille des ' + arbre.famille,
        buttons: [
          {
            text: 'Afficher le détail',
            handler: () => {
              this.openDetail(arbre.essence_id);
            }
          }
        ]
      });
      updateAlert.present();
    });

    this.markers.addLayer(this.marker);
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

  // Active ou désactive le suivi de l'utilisateur sur la carte
  toggleFollow() {
    if (!this.following) {
      this.subscription = this.geolocation.watchPosition(OPT_GEOLOCATION).subscribe(position => {
        if (position.coords != undefined) {
          if (this.mapBounds.contains(L.latLng(position.coords.latitude, position.coords.longitude))) {
            this.updateMarker({ lat: position.coords.latitude, lng: position.coords.longitude });
          }
        }
      });
    } else {
      this.subscription.unsubscribe();
    }
  }

  // Actualise la position de l'utilisateur
  updateMarker(latlng: { lat: number, lng: number }) {
    if (this.userMarker) {
      this.userMarker = this.userMarker.setLatLng(latlng);
    } else {
      var markerIcon = L.icon({
        iconUrl: 'assets/images/marker.png',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, 8]
      });

      this.userMarker = L.marker(latlng, { icon: markerIcon }).addTo(this.map);
    }
  }
}
