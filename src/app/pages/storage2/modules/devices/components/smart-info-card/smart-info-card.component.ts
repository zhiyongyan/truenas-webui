import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { LoadingState, toLoadingState } from 'app/helpers/to-loading-state.helper';
import { SmartTestResult } from 'app/interfaces/smart-test.interface';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import {
  ManualTestDialogComponent, ManualTestDialogParams,
} from 'app/pages/storage2/modules/disks/components/manual-test-dialog/manual-test-dialog.component';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-smart-info-card',
  templateUrl: './smart-info-card.component.html',
  styleUrls: ['./smart-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartInfoCardComponent implements OnChanges {
  @Input() topologyItem: VDev;
  @Input() disk: Disk;

  totalResults$: Observable<LoadingState<number>>;
  lastResultsInCategory$: Observable<SmartTestResult[]>;
  smartTasksCount$: Observable<LoadingState<number>>;

  readonly tasksMessage = T('{n, plural, =0 {No Tasks} one {# Task} other {# Tasks}} Configured');

  private readonly maxResultCategories = 4;

  constructor(
    private ws: WebSocketService,
    private matDialog: MatDialog,
  ) { }

  ngOnChanges(): void {
    this.loadTestResults();
    this.loadSmartTasks();
  }

  onManualTest(): void {
    const testDialog = this.matDialog.open(ManualTestDialogComponent, {
      data: {
        selectedDisks: [this.disk],
        diskIdsWithSmart: [this.disk.identifier],
      } as ManualTestDialogParams,
    });
    testDialog
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.loadTestResults();
      });
  }

  private loadTestResults(): void {
    const results$ = this.ws.call('smart.test.results', [[['disk', '=', this.topologyItem.disk]]]).pipe(
      map((testResults) => {
        const results = testResults[0]?.tests ?? [];
        return results.filter((result) => result.status !== SmartTestResultStatus.Running);
      }),
    );

    this.totalResults$ = results$.pipe(
      map((results) => results.length),
      toLoadingState(),
    );

    this.lastResultsInCategory$ = results$.pipe(
      map((results) => {
        const lastResultsInCategories = _.uniqBy(results, (result) => result.description);
        return lastResultsInCategories.slice(0, this.maxResultCategories);
      }),
    );
  }

  private loadSmartTasks(): void {
    this.smartTasksCount$ = this.ws.call('smart.test.query_for_disk', [this.topologyItem.disk]).pipe(
      map((tasks) => tasks.length),
      toLoadingState(),
    );
  }
}
