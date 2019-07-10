import { WebSocketService, DialogService, SnackbarService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-rsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService, SnackbarService]
})
export class RsyncListComponent {

  public title = "Rsync Tasks";
  //protected resource_name = 'tasks/rsync';
  protected queryCall = 'rsynctask.query';
  protected wsDelete = 'rsynctask.delete';
  protected route_add: string[] = ['tasks', 'rsync', 'add'];
  protected route_add_tooltip = "Add Rsync Task";
  protected route_edit: string[] = ['tasks', 'rsync', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: T('Path'), prop: 'path' },
    { name: T('Remote Host'), prop: 'remotehost' },
    { name: T('Remote Module Name'), prop: 'remotemodule' },
    { name: T('User'), prop: 'user' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Rsync Task',
      key_props: ['remotehost', 'remotemodule']
    },
  };

  constructor(protected router: Router, protected ws: WebSocketService, protected taskService: TaskService,
              protected dialog: DialogService, protected translate: TranslateService, protected snackBar: SnackbarService) {}

  afterInit(entityList: any) { this.entityList = entityList; }

  getActions(row) {
    const actions = [];
    actions.push({
      label : T("Run Now"),
      id: "run",
      onClick : (members) => {
        this.dialog.confirm(T("Run Now"), T("Run this rsync now?"), true).subscribe((run) => {
          if (run) {
            this.ws.call('rsynctask.run', [row.id] ).subscribe((res) => {
              this.snackBar.open(T('Rsync task started.'), T('CLOSE'), { duration: 5000 });
            }, (err) => {
              new EntityUtils().handleWSError(this, err);
            });
          }
        });
      }
    });
    actions.push({
      label : T("Edit"),
      id: "edit",
      onClick : (task_edit) => {
        this.router.navigate(new Array('/').concat(
          [ 'tasks', 'rsync', 'edit', row.id ]));
      }
    })
    actions.push({
      label : T("Delete"),
      onClick : (task_delete) => {
        this.entityList.doDelete(row);
      },
    });

    return actions;
  }
}
