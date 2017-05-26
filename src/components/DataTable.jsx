/* eslint jsx-a11y/no-static-element-interactions: "off" */
/* eslint react/forbid-prop-types: "off" */
/* eslint class-methods-use-this: "off" */

import React from 'react';
import reactCSS from 'reactcss';
import color from 'color';
import PropTypes from 'prop-types';
import Base from './Base';
import Checkbox from './Checkbox';
import TableCell from './TableCell';
import TableRow from './TableRow';

export default class DataTable extends Base {

  static propTypes = {
    columns: PropTypes.shape({
      order: PropTypes.array,
      width: PropTypes.array,
    }),
    filterRecords: PropTypes.array,
    headers: PropTypes.object,
    multiSelectable: PropTypes.bool,
    noRecordsText: PropTypes.string,
    orderBy: PropTypes.shape({
      column: PropTypes.string,
      direction: PropTypes.oneOf(['asc', 'desc']),
      /* Strings and numbers are supported by default and do not need explicit format config.
        Use date for any dates, must be pure date (Yes: 10/20/1994 No: Updated: 10/20/1994)
      */
      formatter: PropTypes.oneOf(['date']),
      getSortValue: PropTypes.func,
    }),
    onClick: PropTypes.func,
    onHeaderClick: PropTypes.func,
    onChange: PropTypes.func,
    records: PropTypes.array,
    recordInclusion: PropTypes.array,
    returnAllRecordsOnClick: PropTypes.bool,
    selectedColumn: PropTypes.string,
    selectedRows: PropTypes.arrayOf(PropTypes.number),
  }

  static defaultProps = {
    noRecordsText: 'No records found.',
    multiSelectable: false,
    onClick: () => {},
    onChange: () => {},
    onHeaderClick: () => {},
    records: [],
    selectedRows: [],
  };

  displayName = 'DataTable';

  constructor() {
    super();
    this.state = {
      hoveredRow: null,
      isRowHovering: false,
    };
  }

  includeSubRecords(record) {
    const filteredRecord = {};
    Object.getOwnPropertyNames(record).forEach((val) => {
      if (this.props.recordInclusion.indexOf(val) > -1) {
        filteredRecord[val] = record[val];
      }
    });
    return filteredRecord;
  }

  filteredSubRecords(record) {
    let result = false;
    Object.getOwnPropertyNames(record).forEach((val) => {
      this.props.filterRecords.forEach((filterVal) => {
        if (filterVal[val] === record[val]) {
          result = true;
        }
      });
    });
    return result;
  }

  sortRecords(record) {
    const newRecord = {};
    this.props.columns.order.forEach((val) => {
      newRecord[val] = record[val];
    });
    return newRecord;
  }

  processHeaders() {
    let headers = this.props.headers;
    if (!headers) {
      const firstRowCopy = Object.assign({}, this.props.records[0]);

      Object.keys(firstRowCopy).forEach((key) => {
        firstRowCopy[key] = key;
      });

      headers = firstRowCopy;
    }

    if (this.props.columns && this.props.columns.order) {
      return this.sortRecords(headers);
    }

    if (this.props.recordInclusion) {
      const filteredHeaders = {};
      this.props.recordInclusion.forEach((record) => {
        filteredHeaders[record] = headers[record];
      });

      return filteredHeaders;
    }

    return headers;
  }

  sortColumnRecords(mappedRecords) {
    const ops = {
      asc: (a, b) =>
         +(a > b) || +(a === b) - 1,
      desc: (a, b) =>
         +(a < b) || +(a === b) - 1,
    };

    const { getSortValue = value => value } = this.props.orderBy;

    return mappedRecords.sort((a, b) => {
      switch (this.props.orderBy.formatter) {
        case 'date':
          return ops[this.props.orderBy.direction](new Date(a.value), new Date(b.value));
        default:
          return ops[this.props.orderBy.direction](getSortValue(a.value), getSortValue(b.value));
      }
    });
  }

  processRecords() {
    let processedRecords = this.props.records;
    if (this.props.recordInclusion) {
      processedRecords = processedRecords.map((record) =>
        this.includeSubRecords(record));
    }
    if (this.props.filterRecords) {
      processedRecords = processedRecords.filter((record) =>
        this.filteredSubRecords(record));
    }
    if (this.props.columns && this.props.columns.order) {
      processedRecords = processedRecords.map((record) =>
        this.sortRecords(record));
    }
    if (this.props.orderBy) {
      const mappedColValues = processedRecords.map((record, i) => (
        { index: i, value: record[this.props.orderBy.column] }
      ));
      const sortedColumnValues = this.sortColumnRecords(mappedColValues);
      const orderdRecords = sortedColumnValues.map((el) =>
        processedRecords[el.index],
      );
      processedRecords = orderdRecords;
    }
    return processedRecords;
  }

  handleClick(data, e) {
    const returnedData = Object.assign({}, data);
    returnedData.row = this.props.returnAllRecordsOnClick && !this.props.filterRecords ?
      this.props.records[data.yCord] : data.row;
    this.props.onClick(e.target, returnedData);
  }

  handleSelectAll() {
    this.props.onChange(this.processRecords());
  }

  handleRowSelect(row, yCord) {
    const rows = [];
    rows[yCord] = row;
    this.props.onChange(rows);
  }

  renderHeaderItem(style) {
    const headers = this.processHeaders();
    const headerTitles = Object.keys(headers).map((header, i) => {
      const arrowStyle = this.props.orderBy && this.props.orderBy.direction === 'asc'
        ? style.TheadArrowUp : style.TheadArrowDown;
      const isFilteredHeader = this.props.orderBy && this.props.orderBy.column === header;
      return (<th
        key={i}
        onClick={this.props.onHeaderClick.bind(this, header)}
        style={(isFilteredHeader ? style.TheadSelected : style.TheadItems)}
      >
        {isFilteredHeader && <span style={arrowStyle} />}
        {headers[header]}
      </th>);
    },
    );
    const selectAllHeader = (
      <th
        key={0}
        onClick={this.handleSelectAll.bind(this)}
        style={style.TheadItems}
      >
        <Checkbox
          ref={c => this.checkBoxHeaderRef = c}
          checked={false}
        />
      </th>
    );
    return this.props.multiSelectable ? [selectAllHeader, headerTitles] : headerTitles;
  }

  renderHeaderItems(style) {
    return (
      <TableRow
        rowIndex={0}
        style={style.Thead}
      >
        {this.renderHeaderItem(style)}
      </TableRow>
    );
  }

  renderCheckBox(xCord, row, yCord) {
    this.checkBoxRefs = [];
    const shouldBeChecked = this.props.selectedRows.indexOf(yCord) > -1;
    return (
      <TableCell
        key={xCord}
        onClick={this.handleRowSelect.bind(this, row, yCord)}
      >
        <Checkbox
          checked={shouldBeChecked}
          ref={(c) => this.checkBoxRefs.push(c)}
        />
      </TableCell>
    );
  }

  renderItems(columnKey, xCord, row, yCord) {
    const cellData = row[columnKey];
    const cellWidth = (this.props.columns && this.props.columns.width)
      ? this.props.columns.width[xCord] : 'auto';
    return (
      <TableCell
        key={`${xCord}-${yCord}`}
        onClick={this.handleClick.bind(this,
          {
            columnKey,
            xCord,
            cellData,
            row,
            yCord,
          },
         )
       }
        width={cellWidth}
      >
        {row[columnKey]}
      </TableCell>
    );
  }

  renderRow(style, row, i) {
    const rowItems = Object.keys(row).map((item, ri) => this.renderItems(item, ri, row, i));
    const multiSelectItem = this.renderCheckBox(0, row, i);
    return rowItems.length > 0 ? (
      <TableRow
        key={`row-${i}`}
        isHoverable={typeof (this.props.onClick) === 'function'}
        isSelected={this.props.selectedRows.indexOf(i) > -1}
        rowIndex={i}
      >
        { this.props.multiSelectable ? multiSelectItem : undefined }
        { rowItems }
      </TableRow>
    ) : null;
  }

  renderNoResults() {
    let colSpan = Object.keys(this.processHeaders()).length;
    /* We need to add an element to account for the checkbox column for multiselect */
    if (this.props.multiSelectable) {
      colSpan += 1;
    }

    return (
      <TableRow
        rowIndex={0}
      >
        <TableCell
          colSpan={colSpan > 0 ? colSpan : 1}
        >
          {this.props.noRecordsText}
        </TableCell>
      </TableRow>
    );
  }

  renderRows(style, records) {
    const rowResults = records.length > 0 ?
      records.map((item, i) => this.renderRow(style, item, i)) : [];
    return rowResults[0] ? rowResults : this.renderNoResults();
  }

  render() {
    const clr = this.getColors();
    const records = this.processRecords();
    const style = reactCSS({
      default: {
        selected: {
          background: clr.backgroundColors.selected,
        },
        Table: {
          border: 'none',
          color: clr.textColors.primary,
        },
        Thead: {
          background: clr.backgroundColors.tableHeader,
          borderBottom: `1px solid ${clr.structuralColors.divider}`,
        },
        TheadSelected: {
          background: color(clr.backgroundColors.tableHeader).darken(0.1).hexString(),
          borderBottom: `1px solid ${clr.structuralColors.divider}`,
          paddingRight: 10,
        },
        TheadArrowDown: {
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '4px dashed',
          color: clr.textColors.tableHeader,
          display: 'inline-block',
          marginLeft: 10,
          marginRight: 10,
          verticalAlign: 'middle',
          height: 0,
          width: 0,
        },
        TheadArrowUp: {
          borderBottom: '4px dashed',
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          color: clr.textColors.tableHeader,
          display: 'inline-block',
          marginLeft: 10,
          marginRight: 10,
          verticalAlign: 'middle',
          height: 0,
          width: 0,
        },
        TheadItems: {
          background: clr.backgroundColors.tableHeader,
          border: 'none',
          color: clr.textColors.tableHeader,
          padding: '20px',
          fontWeight: 'bold',
          textAlign: 'left',
        },
        TBodyItems: {
          // reset any greedy styles
          border: 'none',
          borderBottom: `1px solid ${clr.structuralColors.divider}`,
          color: clr.textColors.primary,
          padding: '20px',
        },
      },
      hover: {
        TableRow: {
          background: clr.backgroundColors.hover,
          cursor: 'Pointer',
        },
      },
    }, {
      hover: this.state.isRowHovering,
    });

    return (
      <table style={style.Table}>
        <thead>
          {this.renderHeaderItems(style)}
        </thead>
        <tbody>
          {this.renderRows(style, records)}
        </tbody>
      </table>
    );
  }

}
