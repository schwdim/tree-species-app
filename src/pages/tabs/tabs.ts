import { Component } from '@angular/core';

import { ListPage } from '../list/list';
import { FiltersPage } from '../filters/filters';
import { MapPage } from '../map/map';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root: any = ListPage;
  tab2Root: any = FiltersPage;
  tab3Root: any = MapPage;

  constructor() {

  }
}
