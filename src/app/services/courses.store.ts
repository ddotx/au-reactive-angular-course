import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Course, sortCoursesBySeqNo } from '../model/course';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../loading/loading.service';
import { MessagesService } from '../messages/messages.service';

/**
 * Global Singleton
 */

@Injectable({
  providedIn: 'root'
})
export class CoursesStore {

  private subject = new BehaviorSubject<Course[]>([]);

  courses$: Observable<Course[]> = this.subject.asObservable();

  constructor(
    private http: HttpClient,
    private loading: LoadingService, // <--from provider in app module
    private messages: MessagesService // <--from provider in app module
  ) {

    console.warn('---DATA FROM STORE---')
    this.loadAllCourses(); // run once during app lifecycle

  }

  private loadAllCourses() {

    const loadCourses$ = this.http.get<Course[]>('/api/courses')
      .pipe(
        map(response => response["payload"]),
        catchError(err => {
          const message = "Could not load courses";
          this.messages.showErrors(message);
          console.log(message, err);
          return throwError(err);
        }),
        tap(courses => this.subject.next(courses))
      );

    this.loading.showLoaderUntilCompleted(loadCourses$)
      .subscribe();

  }

  saveCourse(courseId: string, changes: Partial<Course>): Observable<any> {

    // ANCHOR: Store Optimistic Data Modification

    // REVIEW: STEP 1 - Update data in Memory
    const courses = this.subject.getValue();

    const index = courses.findIndex(course => course.id == courseId);

    const newCourse: Course = {
      ...courses[index],
      ...changes
    };

    const newCourses: Course[] = courses.slice(0); // completed copied array

    newCourses[index] = newCourse;

    this.subject.next(newCourses);

    // REVIEW: STEP 2 - Save to Backend
    return this.http.put(`/api/courses/${courseId}`, changes)
      .pipe(
        catchError(err => {
          const message = "Could not save course";
          console.log(message, err);
          this.messages.showErrors(message);

          this.subject.next(courses) // * -> Rollback to latest value

          return throwError(err);
        }),
        shareReplay()
      );
  }

  filterByCategory(category: string): Observable<Course[]> {
    return this.courses$
      .pipe(
        map(courses =>
          courses.filter(course => course.category == category)
            .sort(sortCoursesBySeqNo)
        )
      )
  }

}
