import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../model/user';
import { map, shareReplay, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

const AUTH_DATA = "auth_data";

@Injectable({
  providedIn: 'root'
})
export class AuthStore {

  private subject = new BehaviorSubject<User>(null);

  user$: Observable<User> = this.subject.asObservable();

  isLoggedIn$: Observable<boolean>;
  isLoggedOut$: Observable<boolean>;

  constructor(private http: HttpClient) {

    console.warn('Auth Store Run')

    this.isLoggedIn$ = this.user$.pipe(
      map(user => !!user),
      tap((user) => console.log(`user loggedIn = ${user}`))
    );

    this.isLoggedOut$ = this.isLoggedIn$.pipe(
      map(loggedIn => !loggedIn),
      tap((user) => console.log(`user loggedOut = ${user}`))
    );

    const user = localStorage.getItem(AUTH_DATA);

    if (user) {
      this.subject.next(JSON.parse(user));
    }

  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<User>("/api/login", { email, password })
      .pipe(
        tap(user => {
          this.subject.next(user);
          localStorage.setItem(AUTH_DATA, JSON.stringify(user));
        }),
        shareReplay()
      );
  }

  logout() {
    this.subject.next(null);
    localStorage.removeItem(AUTH_DATA);
  }


}
