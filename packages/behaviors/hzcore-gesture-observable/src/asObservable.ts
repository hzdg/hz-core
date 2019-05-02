import Observable from 'zen-observable';
import {Source} from 'callbag';
import pipe from 'callbag-pipe';
import subscribe from 'callbag-subscribe';

export default function asObservable<T>(source: Source<T>): Observable<T> {
  return new Observable(observer => {
    observer.next = observer.next.bind(observer);
    observer.error = observer.error.bind(observer);
    observer.complete = observer.complete.bind(observer);
    return pipe(
      source,
      subscribe(observer),
    );
  });
}
