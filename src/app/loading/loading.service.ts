/**
 * Shared Service
 * Decoupled component communication
 */

import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";
import { tap, concatMap, finalize } from "rxjs/operators";

@Injectable() // ==> because of multiple instances
export class LoadingService {

  private loadingSubject = new BehaviorSubject<boolean>(false);

  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() {
    console.log("Loading service created ...");
  }

  showLoaderUntilCompleted<T>(obs$: Observable<T>): Observable<T> {
    return of(null) // make initial obs
      .pipe(
        tap(() => this.loadingOn()),
        concatMap(() => obs$), // transform to new obs (existing obs from argument)
        finalize(() => this.loadingOff())
      );
  }

  loadingOn() {
    this.loadingSubject.next(true);
  }

  loadingOff() {
    this.loadingSubject.next(false);
  }

}
