import { Injectable } from '@angular/core';
import { ref, push, onValue, remove, get, update } from 'firebase/database';
import { database } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // Save a new point
  savePoint(point: { name: string; coordinates: string }) {
    const pointsRef = ref(database, 'points');
    return push(pointsRef, point);
  }

  getPoints() {
    const pointsRef = ref(database, 'points');
    return new Promise((resolve, reject) => {
      onValue(
        pointsRef,
        (snapshot) => {
          const data = snapshot.val();
          resolve(data);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  getPointById(id: string) {
    const pointRef = ref(database, 'points/' + id);
    return new Promise((resolve, reject) => {
      get(pointRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            resolve(snapshot.val());
          } else {
            reject(new Error('Point not found'));
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  deletePoint(id: string) {
    const pointRef = ref(database, 'points/' + id);
    return remove(pointRef);
  }

  updatePoint(id: string, data: { name: string; coordinates: string }) {
    const pointRef = ref(database, 'points/' + id);
    return update(pointRef, data);
  }
}
