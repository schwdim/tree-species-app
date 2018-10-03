import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { HttpModule } from '@angular/http';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { SQLite } from '@ionic-native/sqlite';
import { File } from '@ionic-native/file';
import { FileTransfer } from '@ionic-native/file-transfer';
import { FilterService } from '../providers/filter-service';



import { MyApp } from './app.component';
import { FiltersPage } from '../pages/filters/filters';
import { ListPage } from '../pages/list/list';
import { TabsPage } from '../pages/tabs/tabs';
import { MapPage } from '../pages/map/map';
import { DetailPage } from '../pages/detail/detail';
import { FilteredMapPage } from '../pages/filtered-map-page/filtered-map-page';


@NgModule({
  declarations: [
    MyApp,
    FiltersPage,
    MapPage,
    ListPage,
    DetailPage,
    FilteredMapPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    FiltersPage,
    MapPage,
    ListPage,
    DetailPage,
    FilteredMapPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    SQLite,
    File,
    FileTransfer,
    FilterService,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
