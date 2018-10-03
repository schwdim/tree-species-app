import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

/*
  Generated class for the FilterService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class FilterService {
  public aaz_francais: number = 1;
  public aaz_latin: number = 0;
  public aaz_famille: number = 0;
  public arbre: boolean = false;
  public conifere: boolean = false;
  public arbuste: boolean = false;
  public clr_aucune: boolean = false;
  public clr_rouge: boolean = false;
  public clr_rose: boolean = false;
  public clr_orange: boolean = false;
  public clr_bleu: boolean = false;
  public clr_violet: boolean = false;
  public clr_jaune: boolean = false;
  public clr_blanc: boolean = false;

  getOrderByName() {
    let orderByName = "essences.nom";

    if (this.aaz_famille != 0) {
      orderByName = "famille";
    } else if (this.aaz_latin != 0) {
      orderByName = "nom_latin";
    }

    return orderByName;
  }

  getIfReverse() {
    let reverse = false;

    if (this.aaz_famille != 0 && this.aaz_famille == 2) {
      reverse = true;
    } else if (this.aaz_latin != 0 && this.aaz_latin == 2) {
      reverse = true;
    } else if (this.aaz_francais == 2) {
      reverse = true;
    }
    return reverse
  }

  getIfColorFiltered() {
    let colorFiltered = false;

    if (this.clr_aucune)
      colorFiltered = true;
    else if (this.clr_rouge)
      colorFiltered = true;
    else if (this.clr_rose)
      colorFiltered = true;
    else if (this.clr_orange)
      colorFiltered = true;
    else if (this.clr_jaune)
      colorFiltered = true;
    else if (this.clr_violet)
      colorFiltered = true;
    else if (this.clr_bleu)
      colorFiltered = true;
    else if (this.clr_blanc)
      colorFiltered = true;

    return colorFiltered;
  }

  getIfTypeFiltered() {
    let typeFiltered = false;

    if (this.arbre)
      typeFiltered = true;
    else if (this.conifere)
      typeFiltered = true;
    else if (this.arbuste)
      typeFiltered = true;

    return typeFiltered;
  }

  getFilteredTypes() {
    let types: Array<any> = [];
    if (this.arbre)
      types.push("arbre");
    if (this.conifere)
      types.push("conifere");
    if (this.arbuste)
      types.push("arbuste");

    return types;
  }

  getFilteredColors() {
    let colors: Array<any> = [];
    if (this.clr_aucune)
      colors.push("aucune");
    if (this.clr_rouge)
      colors.push("rouge");
    if (this.clr_rose)
      colors.push("rose");
    if (this.clr_orange)
      colors.push("orange");
    if (this.clr_jaune)
      colors.push("jaune");
    if (this.clr_violet)
      colors.push("violet");
    if (this.clr_bleu)
      colors.push("bleu");
    if (this.clr_blanc)
      colors.push("blanc");

    return colors;
  }

  resetFilters() {
    this.aaz_francais = 1;
    this.aaz_latin = 0;
    this.aaz_famille = 0;
    this.arbre = false;
    this.conifere = false;
    this.arbuste = false;
    this.clr_aucune = false;
    this.clr_rouge = false;
    this.clr_rose = false;
    this.clr_orange = false;
    this.clr_bleu = false;
    this.clr_violet = false;
    this.clr_jaune = false;
    this.clr_blanc = false;
  }
}
