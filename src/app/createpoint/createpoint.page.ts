import { Component, OnInit, inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { DataService } from '../data.service';
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';
import { ActivatedRoute } from '@angular/router';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-createpoint',
  templateUrl: './createpoint.page.html',
  styleUrls: ['./createpoint.page.scss'],
  standalone: false,
})
export class CreatepointPage implements OnInit {
  map!: L.Map;

  name = '';
  coordinates = '';
  pointId: string | null = null;

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);

  constructor() {}

  ngOnInit() {
    this.pointId = this.route.snapshot.paramMap.get('id');
    if (this.pointId) {
      this.dataService
        .getPointById(this.pointId)
        .then((point: any) => {
          if (point && typeof point.coordinates === 'string') {
            this.name = point.name;
            this.coordinates = point.coordinates;
            const coords = this.coordinates.split(',').map((c) => parseFloat(c));
            this.initializeMap(coords[0], coords[1]);
          } else {
            this.showAlertAndGoBack(
              'Error',
              'Point data is invalid or missing coordinates.'
            );
          }
        })
        .catch((error) => {
          console.error('Error fetching point data: ', error);
          this.showAlertAndGoBack('Error', 'Could not fetch point data.');
        });
    } else {
      this.initializeMap(-7.7956, 110.3695);
    }
  }

  initializeMap(lat: number, lng: number) {
    setTimeout(() => {
      this.map = L.map('mapcreate').setView([lat, lng], 13);

      var osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      );

      // Esri World Imagery
      var esri = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'ESRI',
        }
      );

      osm.addTo(this.map);

      // Layer control
      var baseMaps = {
        OpenStreetMap: osm,
        'Esri World Imagery': esri,
      };

      L.control.layers(baseMaps).addTo(this.map);

      var tooltip =
        'Drag the marker or move the map<br>to change the coordinates<br>of the location';
      var marker = L.marker([lat, lng], { draggable: true });
      marker.addTo(this.map);
      marker.bindPopup(tooltip);
      marker.openPopup();

      //Dragend marker
      marker.on('dragend', (e) => {
        let latlng = e.target.getLatLng();
        let lat = latlng.lat.toFixed(9);
        let lng = latlng.lng.toFixed(9);

        // push lat lng to coordinates input
        this.coordinates = lat + ',' + lng;

        console.log(this.coordinates);
      });
    });
  }

  async showAlertAndGoBack(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.navCtrl.back();
          },
        },
      ],
    });
    await alert.present();
  }

  async save() {
    if (this.name && this.coordinates) {
      try {
        if (this.pointId) {
          await this.dataService.updatePoint(this.pointId, {
            name: this.name,
            coordinates: this.coordinates,
          });
        } else {
          await this.dataService.savePoint({
            name: this.name,
            coordinates: this.coordinates,
          });
        }
        // back to route maps
        this.navCtrl.back();
      } catch (error: any) {
        const alert = await this.alertCtrl.create({
          header: 'Save Failed',
          message: error.message,
          buttons: ['OK'],
        });
        await alert.present();
      }
    }
  }
}