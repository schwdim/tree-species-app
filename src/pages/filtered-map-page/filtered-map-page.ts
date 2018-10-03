import { Component } from '@angular/core';
import { NavController, NavParams, App, Events } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Geolocation } from '@ionic-native/geolocation';

import * as L from "leaflet";

const OPT_GEOLOCATION = { maximumAge: 12000, timeout: 5000, enableHighAccuracy: false };

@Component({
  selector: 'page-filtered-map-page',
  templateUrl: 'filtered-map-page.html'
})
export class FilteredMapPage {

  private essence_id: number;

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

  constructor(private events: Events, private app: App, private navCtrl: NavController,
    private geolocation: Geolocation, private navParams: NavParams, private sqlite: SQLite) {
    this.essence_id = navParams.get("essence_id");

    sqlite.create({ name: "data.db", location: "default" }).then((db) => {
      this.dbObject = db;
      this.center = { lat: 47.417917, lng: 7.075420 };
      this.initMap();
      this.loadArbres()
    });
  }

  // Récupération de la liste des arbres
  loadArbres() {
    let select_arbres = "SELECT essence_id, latitude, longitude, visibilite, " +
      "remarquable FROM arbres WHERE essence_id = " + this.essence_id;

    console.log(select_arbres);

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

    this.map = L.map('map-filtered', {
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
    this.markers.addLayer(this.marker);
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
