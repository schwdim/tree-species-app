import { Component } from '@angular/core';

import { NavController, Events, ToastController} from 'ionic-angular';
import { FilterService } from '../../providers/filter-service'

@Component({
  selector: 'page-filters',
  templateUrl: 'filters.html'
})
export class FiltersPage {

  frIcon: string = "mdi mdi-sort-descending mdi-24px";
  latIcon: string = "mdi mdi-sort mdi-24px";
  famIcon: string = "mdi mdi-sort mdi-24px";

  private aaz_francais: number;
  private aaz_latin: number;
  private aaz_famille: number;
  private arbre: boolean;
  private conifere: boolean;
  private arbuste: boolean;
  private clr_aucune: boolean;
  private clr_rouge: boolean;
  private clr_rose: boolean;
  private clr_orange: boolean;
  private clr_bleu: boolean;
  private clr_violet: boolean;
  private clr_jaune: boolean;
  private clr_blanc: boolean;


  constructor(public navCtrl: NavController, public filters: FilterService,
    public events: Events, private toastCtrl: ToastController) {
    this.aaz_francais = this.filters.aaz_francais;
    this.aaz_latin = this.filters.aaz_latin;
    this.aaz_famille = this.filters.aaz_famille;
    this.arbre = this.filters.arbre;
    this.conifere = this.filters.conifere;
    this.arbuste = this.filters.arbuste;
    this.clr_aucune = this.filters.clr_aucune;
    this.clr_rouge = this.filters.clr_rouge;
    this.clr_rose = this.filters.clr_rose;
    this.clr_orange = this.filters.clr_orange;
    this.clr_bleu = this.filters.clr_bleu;
    this.clr_violet = this.filters.clr_violet;
    this.clr_jaune = this.filters.clr_jaune;
    this.clr_blanc = this.filters.clr_blanc;
  }

  ionViewWillEnter() {
    this.aaz_francais = this.filters.aaz_francais;
    this.aaz_latin = this.filters.aaz_latin;
    this.aaz_famille = this.filters.aaz_famille;
    this.arbre = this.filters.arbre;
    this.conifere = this.filters.conifere;
    this.arbuste = this.filters.arbuste;
    this.clr_aucune = this.filters.clr_aucune;
    this.clr_rouge = this.filters.clr_rouge;
    this.clr_rose = this.filters.clr_rose;
    this.clr_orange = this.filters.clr_orange;
    this.clr_bleu = this.filters.clr_bleu;
    this.clr_violet = this.filters.clr_violet;
    this.clr_jaune = this.filters.clr_jaune;
    this.clr_blanc = this.filters.clr_blanc;
  }

  filtreNomFR() {
    this.aaz_latin = 0;
    this.aaz_famille = 0;
    this.latIcon = "mdi mdi-sort mdi-24px";
    this.famIcon = "mdi mdi-sort mdi-24px";

    switch (this.aaz_francais) {
      case 0:
        this.aaz_francais += 1;
        this.frIcon = "mdi mdi-sort-descending mdi-24px";
        break;
      case 1:
        this.aaz_francais += 1;
        this.frIcon = "mdi mdi-sort-ascending mdi-24px";
        break;
      case 2:
        this.aaz_francais = 1;
        this.frIcon = "mdi mdi-sort-descending mdi-24px";
        break;
    }
  }

  filtreNomLAT() {
    this.aaz_francais = 0;
    this.aaz_famille = 0;
    this.frIcon = "mdi mdi-sort mdi-24px";
    this.famIcon = "mdi mdi-sort mdi-24px";

    switch (this.aaz_latin) {
      case 0:
        this.aaz_latin += 1;
        this.latIcon = "mdi mdi-sort-descending mdi-24px";
        break;
      case 1:
        this.aaz_latin += 1;
        this.latIcon = "mdi mdi-sort-ascending mdi-24px";
        break;
      case 2:
        this.aaz_latin = 0;
        this.latIcon = "mdi mdi-sort mdi-24px";
        this.aaz_francais = 1;
        this.frIcon = "mdi mdi-sort-descending mdi-24px";
        break;
    }
  }

  filtreNomFAM() {
    this.aaz_francais = 0;
    this.aaz_latin = 0;
    this.frIcon = "mdi mdi-sort mdi-24px";
    this.latIcon = "mdi mdi-sort mdi-24px";

    switch (this.aaz_famille) {
      case 0:
        this.aaz_famille += 1;
        this.famIcon = "mdi mdi-sort-descending mdi-24px";
        break;
      case 1:
        this.aaz_famille += 1;
        this.famIcon = "mdi mdi-sort-ascending mdi-24px";
        break;
      case 2:
        this.aaz_famille = 0;
        this.famIcon = "mdi mdi-sort mdi-24px";
        this.aaz_francais = 1;
        this.frIcon = "mdi mdi-sort-descending mdi-24px";
        break;
    }
  }

  filtreArbres() {
    this.arbre = !this.arbre;
  }

  filtreConiferes() {
    this.conifere = !this.conifere;
  }

  filtreArbustes() {
    this.arbuste = !this.arbuste;
  }

  filtreAucune() {
    this.clr_aucune = !this.clr_aucune;
  }

  filtreRouge() {
    this.clr_rouge = !this.clr_rouge;
  }

  filtreRose() {
    this.clr_rose = !this.clr_rose;
  }

  filtreOrange() {
    this.clr_orange = !this.clr_orange;
  }

  filtreJaune() {
    this.clr_jaune = !this.clr_jaune;
  }

  filtreBleu() {
    this.clr_bleu = !this.clr_bleu;
  }

  filtreViolet() {
    this.clr_violet = !this.clr_violet;
  }

  filtreBlanc() {
    this.clr_blanc = !this.clr_blanc;
  }

  applyFilters() {
    this.filters.aaz_francais = this.aaz_francais;
    this.filters.aaz_latin = this.aaz_latin;
    this.filters.aaz_famille = this.aaz_famille;
    this.filters.arbre = this.arbre;
    this.filters.conifere = this.conifere;
    this.filters.arbuste = this.arbuste;
    this.filters.clr_aucune = this.clr_aucune;
    this.filters.clr_rouge = this.clr_rouge;
    this.filters.clr_rose = this.clr_rose;
    this.filters.clr_orange = this.clr_orange;
    this.filters.clr_bleu = this.clr_bleu;
    this.filters.clr_violet = this.clr_violet;
    this.filters.clr_jaune = this.clr_jaune;
    this.filters.clr_blanc = this.clr_blanc;

    this.events.publish('refresh');

    let toast = this.toastCtrl.create({
      message: 'Liste et Carte filtrées',
      duration: 3000,
      position: 'top'
    });

    toast.present();
  }

}
