import { Component, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { DataService } from '../data.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {
  map!: L.Map;

  private dataService = inject(DataService);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);

  constructor() {}

  async loadPoints() {
    const points: any = await this.dataService.getPoints();
    for (const key in points) {
      if (points.hasOwnProperty(key)) {
        const point = points[key];
        const coordinates = point.coordinates
          .split(',')
          .map((c: string) => parseFloat(c));
        const marker = L.marker(coordinates as L.LatLngExpression).addTo(
          this.map
        );

        const popupContent = this.createPopupContent(key, point, marker);
        marker.bindPopup(popupContent);
      }
    }

    this.map.on('popupopen', (e) => {
      const popup = e.popup;
    });
  }

  private createPopupContent(
    key: string,
    point: any,
    marker: L.Marker
  ): HTMLElement {
    const popupContent = document.createElement('div');
    popupContent.innerHTML = `
      <span>${point.name}</span>
      <button class="edit-button"><ion-icon name="create-outline" style="color: orange;"></ion-icon></button>
      <button class="delete-button"><ion-icon name="trash-outline" style="color: red;"></ion-icon></button>
    `;

    const editButton = popupContent.querySelector('.edit-button');
    if (editButton) {
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.editPoint(key);
      });
    }

    const deleteButton = popupContent.querySelector('.delete-button');
    if (deleteButton) {
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.deletePoint(key, marker);
      });
    }

    return popupContent;
  }

  editPoint(pointId: string) {
    this.router.navigate(['/createpoint', pointId]);
  }

  async deletePoint(pointId: string, marker: L.Marker) {
    const alert = await this.alertCtrl.create({
      header: 'Konfirmasi',
      message: 'Apakah Anda yakin ingin menghapus titik ini?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Delete canceled');
          },
        },
        {
          text: 'Hapus',
          handler: async () => {
            try {
              await this.dataService.deletePoint(pointId);
              this.map.removeLayer(marker);
            } catch (error) {
              console.error('Error deleting point: ', error);
            }
          },
        },
      ],
    });

    await alert.present();
  }

  ngOnInit() {
    if (!this.map) {
      setTimeout(() => {
        this.map = L.map('map').setView([-7.7956, 110.3695], 13);

        var osm = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors',
          }
        );

        osm.addTo(this.map);

        osm.addTo(this.map);
        L.marker([-7.7956, 110.3695])
          .addTo(this.map)
          .bindPopup('yogyakarta')
          .openPopup();

        this.loadPoints();
      });
    }
  }
}
